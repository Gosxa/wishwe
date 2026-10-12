import base64
import io
import logging
import os

import requests
from PIL import Image
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from event.models import EventStatus
from notifications.models import (
    Notification,
    NotificationType,
    RelatedObjectType,
)
from user.models import ImageModeration, ModerationViolation, Profile
from user.services.moderation_service import (
    ModerationService,
    find_ban_word_matches,
)


logger = logging.getLogger(__name__)
OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations"
OPENAI_MODEL = "omni-moderation-latest"
HIGH_CONFIDENCE_CATEGORIES = {
    "sexual",
    "violence/graphic",
    "hate/threatening",
    "harassment/threatening",
}
HIGH_CONFIDENCE_THRESHOLD = float(
    os.getenv("IMAGE_MODERATION_REJECT_THRESHOLD", "0.90")
)
REVIEW_THRESHOLD = float(
    os.getenv("IMAGE_MODERATION_REVIEW_THRESHOLD", "0.20")
)


class ImageModerationError(Exception):
    """Raised when OCR or the moderation provider cannot check an image."""


def _prepare_image(image_file):
    image_file.open("rb")
    try:
        with Image.open(image_file) as image:
            image = image.convert("RGB")
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=90)
            return output.getvalue(), image.copy()
    finally:
        image_file.close()


def extract_image_text(image):
    """Read English text embedded in an image using local Tesseract OCR."""
    try:
        import pytesseract

        tesseract_cmd = os.getenv("TESSERACT_CMD")
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        return pytesseract.image_to_string(image, lang="eng").strip()
    except Exception as error:
        raise ImageModerationError("Image OCR failed.") from error


def request_openai_moderation(*, image_bytes, ocr_text):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ImageModerationError("OPENAI_API_KEY is not configured.")

    image_data = base64.b64encode(image_bytes).decode("ascii")
    inputs = []
    if ocr_text:
        inputs.append({"type": "text", "text": ocr_text[:10000]})
    inputs.append({
        "type": "image_url",
        "image_url": {
            "url": f"data:image/jpeg;base64,{image_data}",
        },
    })

    try:
        response = requests.post(
            OPENAI_MODERATION_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": OPENAI_MODEL, "input": inputs},
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()["results"][0]
        return {
            "flagged": bool(result.get("flagged")),
            "categories": result.get("categories", {}),
            "category_scores": result.get("category_scores", {}),
            "model": response.json().get("model", OPENAI_MODEL),
        }
    except (requests.RequestException, KeyError, IndexError, ValueError) as error:
        raise ImageModerationError("OpenAI moderation request failed.") from error


def _decision(result, ocr_matches):
    scores = result["category_scores"]
    if any(
        float(scores.get(category, 0)) >= HIGH_CONFIDENCE_THRESHOLD
        for category in HIGH_CONFIDENCE_CATEGORIES
    ):
        return ImageModeration.Status.REJECTED

    if result["flagged"] or ocr_matches:
        return ImageModeration.Status.REVIEW

    if any(float(score) >= REVIEW_THRESHOLD for score in scores.values()):
        return ImageModeration.Status.REVIEW

    return ImageModeration.Status.APPROVED


@transaction.atomic
def queue_image(*, user, target, image, event=None):
    """Stage an uploaded image and enqueue a non-public moderation check."""
    pending = ImageModeration.objects.filter(
        target=target,
        status__in=(
            ImageModeration.Status.QUEUED,
            ImageModeration.Status.REVIEW,
            ImageModeration.Status.FAILED,
        ),
    )
    if target == ImageModeration.Target.AVATAR:
        pending = pending.filter(user=user)
    else:
        pending = pending.filter(event=event)

    for old_request in pending.select_related("violation"):
        if old_request.violation_id and old_request.violation.status == (
            ModerationViolation.Status.PENDING
        ):
            old_request.violation.status = ModerationViolation.Status.OVERTURNED
            old_request.violation.resolved_at = timezone.now()
            old_request.violation.save(update_fields=("status", "resolved_at"))
        old_request.image.delete(save=False)
        old_request.status = ImageModeration.Status.CANCELLED
        old_request.resolved_at = timezone.now()
        old_request.save(update_fields=("image", "status", "resolved_at"))

    request = ImageModeration.objects.create(
        user=user,
        event=event,
        target=target,
        image=image,
    )

    if target == ImageModeration.Target.AVATAR:
        Notification.objects.create(
            recipient=user,
            creator=user,
            type=NotificationType.MODERATION_WARNING,
            title="Avatar pending review",
            message=(
                "Your current avatar will remain visible until the new image "
                "passes its safety check. We will notify you if it needs review."
            ),
            related_object_type=RelatedObjectType.PROFILE,
            related_object_id=user.profile.id,
        )

    from user.tasks import process_image_moderation

    transaction.on_commit(
        lambda: process_image_moderation.delay(request.pk)
    )
    return request


def _violation_matches(request, categories, ocr_text):
    matches = find_ban_word_matches({"image_text": ocr_text})
    if matches:
        return matches

    return [
        {
            "field": request.target,
            "category": category,
            "term": category,
            "excerpt": ocr_text[:500],
        }
        for category, flagged in categories.items()
        if flagged
    ] or [{
        "field": request.target,
        "category": "image_safety",
        "term": "high_confidence_image_safety_signal",
        "excerpt": ocr_text[:500],
    }]


def _activate_event_if_clear(event):
    if not event:
        return
    if not event.__class__.objects.filter(pk=event.pk).exists():
        return
    has_pending_violation = ModerationViolation.objects.filter(
        event=event,
        status=ModerationViolation.Status.PENDING,
    ).exists()
    has_pending_image = ImageModeration.objects.filter(
        event=event,
        status__in=(
            ImageModeration.Status.QUEUED,
            ImageModeration.Status.REVIEW,
            ImageModeration.Status.FAILED,
        ),
    ).exists()
    if not has_pending_violation and not has_pending_image:
        event.status = EventStatus.ACTIVE
        event.save(update_fields=("status", "updated_at"))


def _attach_image(request, image_bytes):
    filename = f"moderated-{request.pk}.jpg"
    content = ContentFile(image_bytes, name=filename)
    if request.target == ImageModeration.Target.AVATAR:
        profile = Profile.objects.select_for_update().get(user=request.user)
        profile.avatar.save(filename, content, save=True)
        return

    event = request.event
    if not event:
        return
    event.cover_image.save(filename, content, save=False)
    event.save(update_fields=("cover_image", "updated_at"))


@transaction.atomic
def process_image_result(request_id, *, result, image_bytes, ocr_text):
    request = ImageModeration.objects.select_for_update(
        of=("self",),
    ).select_related(
        "user",
        "event",
    ).get(pk=request_id)
    if request.status != ImageModeration.Status.QUEUED:
        return request.status

    matches = find_ban_word_matches({"image_text": ocr_text})
    decision = _decision(result, matches)
    request.ocr_text = ocr_text[:10000]
    request.categories = result["categories"]
    request.category_scores = result["category_scores"]
    request.model_name = result["model"]
    request.error_message = ""

    if decision == ImageModeration.Status.APPROVED:
        _attach_image(request, image_bytes)
        request.status = ImageModeration.Status.APPROVED
        request.resolved_at = timezone.now()
        request.image.delete(save=False)
        request.save(update_fields=(
            "status", "resolved_at", "image", "ocr_text", "categories",
            "category_scores", "model_name", "error_message",
        ))
        _activate_event_if_clear(request.event)
        return request.status

    violation = ModerationService.record_violation(
        user=request.user,
        event=request.event,
        matches=_violation_matches(
            request,
            result["categories"],
            ocr_text,
        ),
        pending=decision == ImageModeration.Status.REVIEW,
        apply_strike=decision == ImageModeration.Status.REJECTED,
        image_violation=True,
    )
    request.violation = violation
    request.status = decision
    request.resolved_at = (
        timezone.now()
        if decision == ImageModeration.Status.REJECTED else None
    )
    if decision == ImageModeration.Status.REJECTED:
        request.image.delete(save=False)
    request.save(update_fields=(
        "status", "resolved_at", "image", "violation", "ocr_text",
        "categories", "category_scores", "model_name", "error_message",
    ))
    _activate_event_if_clear(request.event)
    return request.status


def process_image_moderation_request(request_id):
    request = ImageModeration.objects.select_related(
        "user",
        "event",
    ).get(pk=request_id)
    if request.status != ImageModeration.Status.QUEUED:
        return request.status

    if (
        (request.target == ImageModeration.Target.EVENT_COVER and not request.event)
        or request.user.profile.is_banned
    ):
        request.image.delete(save=False)
        request.status = ImageModeration.Status.CANCELLED
        request.resolved_at = timezone.now()
        request.save(update_fields=("image", "status", "resolved_at"))
        return request.status

    try:
        image_bytes, image = _prepare_image(request.image)
        ocr_text = extract_image_text(image)
        result = request_openai_moderation(
            image_bytes=image_bytes,
            ocr_text=ocr_text,
        )
    except Exception as error:
        logger.warning(
            "Image moderation check failed for request %s: %s",
            request_id,
            error,
        )
        raise ImageModerationError("Image moderation check failed.") from error

    return process_image_result(
        request_id,
        result=result,
        image_bytes=image_bytes,
        ocr_text=ocr_text,
    )


@transaction.atomic
def resolve_image_moderation(request_id, *, approved):
    request = ImageModeration.objects.select_for_update(
        of=("self",),
    ).select_related(
        "user",
        "event",
        "violation",
    ).get(pk=request_id)
    if request.status != ImageModeration.Status.REVIEW:
        return request

    now = timezone.now()
    violation = request.violation
    profile = Profile.objects.select_for_update().get(user=request.user)

    if approved:
        request.image.open("rb")
        image_bytes = request.image.read()
        request.image.close()
        _attach_image(request, image_bytes)
        if violation:
            violation.status = ModerationViolation.Status.OVERTURNED
            violation.resolved_at = now
            violation.save(update_fields=("status", "resolved_at"))
        request.image.delete(save=False)
        request.status = ImageModeration.Status.APPROVED
    else:
        if violation:
            violation.status = ModerationViolation.Status.CONFIRMED
            violation.strike_applied = True
            violation.resolved_at = now
            violation.save(update_fields=(
                "status", "strike_applied", "resolved_at",
            ))
        profile.violation_count += 1
        profile.last_violation_at = now
        profile.save(update_fields=(
            "violation_count", "last_violation_at", "updated_at",
        ))
        request.status = ImageModeration.Status.REJECTED
        request.image.delete(save=False)

        if profile.is_banned:
            ModerationService.enforce_ban(user=request.user, profile=profile)

    request.resolved_at = now
    request.save(update_fields=("status", "resolved_at", "image"))
    if not profile.is_banned:
        _activate_event_if_clear(request.event)
    return request


def retry_image_moderation(request_id):
    updated = ImageModeration.objects.filter(
        pk=request_id,
        status=ImageModeration.Status.FAILED,
    ).update(status=ImageModeration.Status.QUEUED, error_message="")
    if updated:
        from user.tasks import process_image_moderation

        process_image_moderation.delay(request_id)
    return bool(updated)


def mark_image_moderation_failed(request_id, error):
    ImageModeration.objects.filter(
        pk=request_id,
        status=ImageModeration.Status.QUEUED,
    ).update(
        status=ImageModeration.Status.FAILED,
        error_message=str(error)[:500],
    )
