import json
import re
import unicodedata
from datetime import timedelta
from functools import lru_cache
from pathlib import Path

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from event.models import Event, EventParticipant, EventStatus
from notifications.models import (
    Notification,
    NotificationType,
    RelatedObjectType,
)
from user.models import (
    Friendship,
    ImageModeration,
    ModerationViolation,
    Profile,
)


LEXICON_PATH = Path(__file__).with_name("ban_words.json")
LEET_MAP = str.maketrans({
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "@": "a",
    "$": "s",
})


@lru_cache(maxsize=1)
def get_ban_words():
    with LEXICON_PATH.open(encoding="utf-8") as lexicon_file:
        return json.load(lexicon_file)


def normalize_text(value):
    value = unicodedata.normalize("NFKD", str(value)).casefold()
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.translate(LEET_MAP)
    return " ".join(re.findall(r"[a-z0-9]+", value))


def find_ban_word_matches(fields):
    normalized_fields = {
        name: normalize_text(value)
        for name, value in fields.items()
        if value
    }
    matches = []

    lexicon = get_ban_words()
    variants = lexicon.get("_variants", {})

    for category, terms in lexicon.items():
        if category.startswith("_"):
            continue
        for term in terms:
            normalized_term = normalize_text(term)
            equivalent_terms = [normalized_term]
            equivalent_terms.extend(
                normalize_text(variant)
                for variant in variants.get(normalized_term, [])
            )
            patterns = []
            for equivalent_term in equivalent_terms:
                words = equivalent_term.split()
                final_word = re.escape(words[-1])
                prefix = r"\s+".join(re.escape(word) for word in words[:-1])
                phrase_prefix = f"{prefix}\\s+" if prefix else ""
                plural_pattern = (
                    rf"{phrase_prefix}{final_word}(?:s|es)?"
                )
                patterns.append(
                    rf"(?<![a-z0-9]){plural_pattern}(?![a-z0-9])"
                )
            for field_name, normalized_value in normalized_fields.items():
                if any(
                    re.search(pattern, normalized_value)
                    for pattern in patterns
                ):
                    original_value = str(fields[field_name])
                    matches.append({
                        "field": field_name,
                        "category": category,
                        "term": term,
                        "excerpt": original_value[:500],
                    })

    return matches


class ModerationService:
    @staticmethod
    @transaction.atomic
    def record_violation(
        *, user, matches, event=None, pending=False, apply_strike=True,
        image_violation=False,
    ):
        profile = Profile.objects.select_for_update().get(user=user)
        if apply_strike:
            profile.violation_count += 1
            profile.last_violation_at = timezone.now()
            profile.save(update_fields=(
                "violation_count",
                "last_violation_at",
                "updated_at",
            ))

        violation = ModerationViolation.objects.create(
            user=user,
            event=event,
            event_uuid=event.uuid if event else None,
            field_name=", ".join(sorted({item["field"] for item in matches})),
            categories=sorted({item["category"] for item in matches}),
            matched_terms=sorted({item["term"] for item in matches}),
            content_excerpt=" | ".join(
                dict.fromkeys(item.get("excerpt", "") for item in matches)
            )[:500],
            status=(
                ModerationViolation.Status.PENDING
                if pending else ModerationViolation.Status.CONFIRMED
            ),
            strike_applied=apply_strike,
        )

        Notification.objects.create(
            recipient=user,
            creator=user,
            type=NotificationType.MODERATION_WARNING,
            title=(
                "Event image sent for review"
                if image_violation and pending and event else
                "Profile image sent for review"
                if image_violation and pending else
                "Event image removed"
                if image_violation and event else
                "Profile image rejected"
                if image_violation else
                "Event sent for review"
                if pending and event else
                "Profile update rejected"
            ),
            message=(
                "Your event image is held for administrator review. No "
                "violation is counted while it is under review."
                if image_violation and pending and event else
                "Your new profile image is held for administrator review. "
                "Your current avatar remains visible. No violation is "
                "counted while it is under review."
                if image_violation and pending else
                "Your event image was rejected and removed. A warning has "
                "been recorded. Warnings expire after 30 days below three "
                "violations. You can appeal by contacting support from "
                "your account email."
                if image_violation and event else
                "Your profile image was rejected. Your previous avatar "
                "remains visible. A warning has been recorded. Warnings "
                "expire after 30 days below three violations. You can "
                "appeal by contacting support from your account email."
                if image_violation else
                "Your previously published event is hidden while an "
                "administrator reviews its content. No violation is counted "
                "while it is under review."
                if pending and event and not apply_strike else
                "Your event is hidden while an administrator reviews its "
                "content. If it is approved, this warning will be removed."
                if pending and event else
                "Your profile change was rejected for violating the content "
                "rules. Warnings expire after 30 days below three violations. "
                "You can appeal by contacting support from your account email."
            ),
            related_object_type=(
                RelatedObjectType.EVENT if event else RelatedObjectType.PROFILE
            ),
            related_object_id=event.id if event else profile.id,
        )

        if not pending and profile.is_banned:
            ModerationService.enforce_ban(user=user, profile=profile)

        return violation

    @staticmethod
    @transaction.atomic
    def enforce_ban(*, user, profile=None):
        profile = profile or Profile.objects.select_for_update().get(user=user)
        if not profile.is_banned:
            return

        profile.is_private = True
        profile.save(update_fields=("is_private", "updated_at"))
        ModerationViolation.objects.filter(
            user=user,
            status=ModerationViolation.Status.PENDING,
        ).update(
            status=ModerationViolation.Status.CONFIRMED,
            resolved_at=timezone.now(),
        )
        pending_images = ImageModeration.objects.select_for_update().filter(
            user=user,
            status__in=(
                ImageModeration.Status.QUEUED,
                ImageModeration.Status.REVIEW,
                ImageModeration.Status.FAILED,
            ),
        )
        for image_review in pending_images:
            image_review.image.delete(save=False)
            image_review.status = ImageModeration.Status.CANCELLED
            image_review.resolved_at = timezone.now()
            image_review.save(update_fields=("image", "status", "resolved_at"))
        Event.objects.filter(creator=user).delete()
        EventParticipant.objects.filter(user=user).delete()
        Friendship.objects.filter(Q(sender=user) | Q(receiver=user)).delete()

    @staticmethod
    @transaction.atomic
    def resolve_event(event, *, approved):
        violations = list(
            ModerationViolation.objects.select_for_update().filter(
                event=event,
                status=ModerationViolation.Status.PENDING,
            )
        )
        now = timezone.now()

        if approved:
            for violation in violations:
                violation.status = ModerationViolation.Status.OVERTURNED
                violation.resolved_at = now
                violation.save(update_fields=("status", "resolved_at"))
            counted_violations = [
                violation for violation in violations
                if violation.strike_applied
            ]
            if counted_violations:
                profile = Profile.objects.select_for_update().get(
                    user=event.creator,
                )
                profile.violation_count = max(
                    0,
                    profile.violation_count - len(counted_violations),
                )
                remaining = ModerationViolation.objects.filter(
                    user=event.creator,
                    strike_applied=True,
                    status__in=(
                        ModerationViolation.Status.CONFIRMED,
                        ModerationViolation.Status.PENDING,
                    ),
                ).order_by("-occurred_at").first()
                profile.last_violation_at = (
                    remaining.occurred_at if remaining else None
                )
                profile.save(update_fields=(
                    "violation_count",
                    "last_violation_at",
                    "updated_at",
                ))

            event.status = EventStatus.ACTIVE
            event.save(update_fields=("status", "updated_at"))
            Notification.objects.create(
                recipient=event.creator,
                creator=event.creator,
                type=NotificationType.MODERATION_WARNING,
                title="Event approved",
                message="Your event passed review and is now visible.",
                related_object_type=RelatedObjectType.EVENT,
                related_object_id=event.id,
            )
            return

        unapplied_violations = [
            violation for violation in violations
            if not violation.strike_applied
        ]
        for violation in violations:
            violation.status = ModerationViolation.Status.CONFIRMED
            violation.resolved_at = now
            if not violation.strike_applied:
                violation.strike_applied = True
            violation.save(update_fields=(
                "status",
                "resolved_at",
                "strike_applied",
            ))

        if unapplied_violations:
            profile = Profile.objects.select_for_update().get(
                user=event.creator,
            )
            profile.violation_count += len(unapplied_violations)
            profile.last_violation_at = now
            profile.save(update_fields=(
                "violation_count",
                "last_violation_at",
                "updated_at",
            ))

        user = event.creator
        event.delete()
        Notification.objects.create(
            recipient=user,
            creator=user,
            type=NotificationType.MODERATION_WARNING,
            title="Event removed after review",
            message=(
                "An administrator reviewed your event and decided it does not "
                "meet the content rules. You can appeal by contacting support "
                "from your account email."
            ),
            related_object_type=RelatedObjectType.PROFILE,
            related_object_id=user.profile.id,
        )
        profile = Profile.objects.select_for_update().get(user=user)

        if profile.is_banned:
            ModerationService.enforce_ban(user=user, profile=profile)

    @staticmethod
    @transaction.atomic
    def expire_monthly_violations():
        now = timezone.now()
        cutoff = now - timedelta(days=30)
        profiles = Profile.objects.select_for_update().filter(
            violation_count__gt=0,
            violation_count__lt=3,
            last_violation_at__lte=cutoff,
        )
        updated_count = 0

        for profile in profiles.iterator():
            if ModerationViolation.objects.filter(
                user=profile.user,
                status=ModerationViolation.Status.PENDING,
                strike_applied=True,
            ).exists():
                continue
            expired_violation = ModerationViolation.objects.filter(
                user=profile.user,
                status=ModerationViolation.Status.CONFIRMED,
                strike_applied=True,
            ).order_by("occurred_at").first()
            if expired_violation:
                expired_violation.status = ModerationViolation.Status.EXPIRED
                expired_violation.resolved_at = now
                expired_violation.save(update_fields=("status", "resolved_at"))
            profile.violation_count -= 1
            profile.last_violation_at = now if profile.violation_count else None
            profile.save(update_fields=(
                "violation_count",
                "last_violation_at",
                "updated_at",
            ))
            updated_count += 1

        return updated_count
