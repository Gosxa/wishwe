import io
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APITestCase

from event.models import Event, EventStatus, EventType
from event.serializers import EventSerializer
from user.models import ImageModeration, ModerationViolation, Profile
from user.services.image_moderation_service import (
    _decision,
    process_image_result,
    queue_image,
    request_openai_moderation,
    resolve_image_moderation,
)
from user.tasks import delete_expired_image_moderation_uploads


User = get_user_model()


def image_upload(name="test.png"):
    image_buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color="white").save(image_buffer, format="PNG")
    return SimpleUploadedFile(
        name,
        image_buffer.getvalue(),
        content_type="image/png",
    )


def normalized_image_bytes():
    image_buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color="white").save(image_buffer, format="JPEG")
    return image_buffer.getvalue()


class ImageModerationPolicyTests(TestCase):
    def test_high_confidence_severe_categories_reject_image(self):
        result = {
            "flagged": True,
            "categories": {"violence/graphic": True},
            "category_scores": {"violence/graphic": 0.95},
        }

        self.assertEqual(
            _decision(result, []),
            ImageModeration.Status.REJECTED,
        )

    def test_flagged_or_ocr_match_is_sent_to_review(self):
        result = {
            "flagged": True,
            "categories": {"hate": True},
            "category_scores": {"hate": 0.75},
        }

        self.assertEqual(
            _decision(result, [{"category": "hate_and_discrimination"}]),
            ImageModeration.Status.REVIEW,
        )

    def test_unflagged_low_scores_are_approved(self):
        result = {
            "flagged": False,
            "categories": {"sexual": False, "violence": False},
            "category_scores": {"sexual": 0.01, "violence": 0.01},
        }

        self.assertEqual(
            _decision(result, []),
            ImageModeration.Status.APPROVED,
        )


class ImageModerationFlowTests(TestCase):
    def setUp(self):
        self.settings_override = override_settings(
            DEBUG=True,
            STORAGES={
                "default": {
                    "BACKEND": "django.core.files.storage.InMemoryStorage",
                },
                "staticfiles": {
                    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
                },
            },
        )
        self.settings_override.enable()
        self.user = User.objects.create_user(
            email="image-moderation@test.com",
            password="testpass123",
        )
        self.profile = Profile.objects.create(
            user=self.user,
            username="image-moderation",
        )

    def tearDown(self):
        self.settings_override.disable()

    def make_event(self, *, status=EventStatus.MODERATE):
        return Event.objects.create(
            creator=self.user,
            event_type=EventType.WISH,
            title="A safe event",
            description="Details",
            location="Budapest",
            timeframe_text="This weekend",
            status=status,
        )

    @staticmethod
    def result(*, flagged=False, categories=None, scores=None):
        return {
            "flagged": flagged,
            "categories": categories or {},
            "category_scores": scores or {},
            "model": "omni-moderation-latest",
        }

    def make_event_image_request(self, event):
        return queue_image(
            user=self.user,
            event=event,
            target=ImageModeration.Target.EVENT_COVER,
            image=image_upload(),
        )

    def test_clean_event_cover_is_attached_after_check(self):
        event = self.make_event()
        request = self.make_event_image_request(event)

        process_image_result(
            request.pk,
            result=self.result(),
            image_bytes=normalized_image_bytes(),
            ocr_text="",
        )

        event.refresh_from_db()
        request.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertTrue(event.cover_image)
        self.assertEqual(request.status, ImageModeration.Status.APPROVED)
        self.assertEqual(self.profile.violation_count, 0)

    def test_ambiguous_image_waits_for_admin_without_strike(self):
        event = self.make_event()
        request = self.make_event_image_request(event)

        process_image_result(
            request.pk,
            result=self.result(
                flagged=True,
                categories={"hate": True},
                scores={"hate": 0.70},
            ),
            image_bytes=normalized_image_bytes(),
            ocr_text="offensive text",
        )

        request.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(request.status, ImageModeration.Status.REVIEW)
        self.assertEqual(self.profile.violation_count, 0)
        self.assertEqual(
            request.violation.status,
            ModerationViolation.Status.PENDING,
        )

        resolve_image_moderation(request.pk, approved=True)

        event.refresh_from_db()
        request.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertTrue(event.cover_image)
        self.assertEqual(request.status, ImageModeration.Status.APPROVED)
        self.assertEqual(request.violation.status, ModerationViolation.Status.OVERTURNED)
        self.assertEqual(self.profile.violation_count, 0)

    def test_pending_cover_preview_is_returned_only_to_its_creator(self):
        event = self.make_event()
        self.make_event_image_request(event)

        owner_data = EventSerializer(
            event,
            context={"request": SimpleNamespace(user=self.user)},
        ).data
        other_user = User.objects.create_user(
            email="other-user@test.com",
            password="testpass123",
        )
        other_data = EventSerializer(
            event,
            context={"request": SimpleNamespace(user=other_user)},
        ).data

        self.assertIsNotNone(owner_data["cover_image"])
        self.assertIsNone(other_data["cover_image"])

    def test_admin_rejection_keeps_image_and_applies_one_strike(self):
        event = self.make_event()
        request = self.make_event_image_request(event)
        process_image_result(
            request.pk,
            result=self.result(flagged=True, categories={"hate": True}),
            image_bytes=normalized_image_bytes(),
            ocr_text="offensive text",
        )

        resolve_image_moderation(request.pk, approved=False)

        event.refresh_from_db()
        request.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertFalse(event.cover_image)
        self.assertEqual(request.status, ImageModeration.Status.REJECTED)
        self.assertEqual(self.profile.violation_count, 1)
        self.assertTrue(request.violation.strike_applied)

    def test_high_confidence_image_is_rejected_with_strike(self):
        event = self.make_event()
        request = self.make_event_image_request(event)

        process_image_result(
            request.pk,
            result=self.result(
                flagged=True,
                categories={"sexual": True},
                scores={"sexual": 0.97},
            ),
            image_bytes=normalized_image_bytes(),
            ocr_text="",
        )

        event.refresh_from_db()
        request.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertFalse(event.cover_image)
        self.assertEqual(request.status, ImageModeration.Status.REJECTED)
        self.assertEqual(self.profile.violation_count, 1)
        self.assertTrue(request.image)

    def test_rejected_image_is_kept_for_seven_days_then_removed(self):
        event = self.make_event()
        request = self.make_event_image_request(event)
        process_image_result(
            request.pk,
            result=self.result(flagged=True, categories={"hate": True}),
            image_bytes=normalized_image_bytes(),
            ocr_text="offensive text",
        )

        request.refresh_from_db()
        self.assertTrue(request.image)
        self.assertTrue(request.image.storage.exists(request.image.name))

        ImageModeration.objects.filter(pk=request.pk).update(
            resolved_at=timezone.now() - timedelta(days=8),
        )
        self.assertEqual(delete_expired_image_moderation_uploads(), 1)

        request.refresh_from_db()
        self.assertFalse(request.image)

    def test_safe_avatar_replaces_existing_avatar_only_after_check(self):
        self.profile.avatar.save("old.png", image_upload(), save=True)
        old_avatar = self.profile.avatar.name
        request = queue_image(
            user=self.user,
            target=ImageModeration.Target.AVATAR,
            image=image_upload("new.png"),
        )

        self.assertEqual(self.profile.avatar.name, old_avatar)
        process_image_result(
            request.pk,
            result=self.result(),
            image_bytes=normalized_image_bytes(),
            ocr_text="",
        )

        self.profile.refresh_from_db()
        self.assertNotEqual(self.profile.avatar.name, old_avatar)


class AvatarModerationStatusApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="avatar-status@test.com",
            password="testpass123",
        )
        self.profile = Profile.objects.create(
            user=self.user,
            username="avatar-status",
        )
        self.client.force_authenticate(self.user)

    def test_returns_latest_avatar_status_and_current_avatar_url(self):
        moderation = ImageModeration.objects.create(
            user=self.user,
            target=ImageModeration.Target.AVATAR,
            image="uploads/moderation/avatar.png",
        )

        response = self.client.get(
            "/api/user/profile/avatar-moderation/",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], moderation.status)
        self.assertIsNone(response.data["avatar"])


class OpenAIModerationRequestTests(TestCase):
    @patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"})
    @patch("user.services.image_moderation_service.requests.post")
    def test_sends_image_and_ocr_text_to_moderation_endpoint(self, post):
        response = Mock()
        response.json.return_value = {
            "model": "omni-moderation-latest",
            "results": [{
                "flagged": False,
                "categories": {"violence": False},
                "category_scores": {"violence": 0.01},
            }],
        }
        post.return_value = response

        result = request_openai_moderation(
            image_bytes=b"jpeg-bytes",
            ocr_text="Safe event poster",
        )

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["model"], "omni-moderation-latest")
        self.assertEqual(payload["input"][0], {
            "type": "text",
            "text": "Safe event poster",
        })
        self.assertTrue(
            payload["input"][1]["image_url"]["url"].startswith(
                "data:image/jpeg;base64,"
            )
        )
        self.assertFalse(result["flagged"])
