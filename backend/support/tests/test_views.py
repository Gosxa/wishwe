from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from support.models import SupportCategory, SupportRequest


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    SUPPORT_EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    EMAIL_HOST_USER="noreply@wishwe.test",
    SUPPORT_EMAIL="support@wishwe.test",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    },
)
class SupportRequestAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            email="member@wishwe.test",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("support:request-create")
        self.payload = {
            "email": "person@example.com",
            "display_name": "Alex Wish",
            "category": SupportCategory.TECHNICAL_ISSUE,
            "message": "The event page does not load.",
        }

    def test_submission_is_saved_and_emailed_to_support(self):
        response = self.client.post(
            self.url,
            self.payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request = SupportRequest.objects.get()
        self.assertEqual(request.user, self.user)
        self.assertEqual(request.email, self.payload["email"])
        self.assertEqual(request.display_name, self.payload["display_name"])
        self.assertEqual(request.category, self.payload["category"])
        self.assertEqual(request.message, self.payload["message"])
        self.assertEqual(
            request.delivery_status,
            SupportRequest.DeliveryStatus.SENT,
        )
        self.assertIsNotNone(request.email_sent_at)

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["support@wishwe.test"])
        self.assertEqual(sent_email.reply_to, [self.payload["email"]])
        self.assertIn("[Technical issue]", sent_email.subject)
        self.assertIn(self.payload["display_name"], sent_email.body)
        self.assertIn(self.payload["message"], sent_email.body)
        self.assertIn(str(self.user.pk), sent_email.body)
        self.assertEqual(response.data["id"], str(request.id))
        self.assertEqual(response.data["delivery_status"], "sent")

    def test_submission_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.post(
            self.url,
            self.payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(SupportRequest.objects.exists())
        self.assertEqual(mail.outbox, [])

    def test_invalid_fields_are_rejected_without_saving_or_emailing(self):
        invalid_payloads = (
            {**self.payload, "email": "not-an-email"},
            {**self.payload, "category": "unknown"},
            {**self.payload, "message": "   "},
            {**self.payload, "message": "x" * 5001},
        )

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post(
                    self.url,
                    payload,
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_400_BAD_REQUEST,
                )

        self.assertFalse(SupportRequest.objects.exists())
        self.assertEqual(mail.outbox, [])

    def test_email_failure_keeps_request_and_reports_failed_delivery(self):
        with self.assertLogs("support", level="ERROR"):
            with patch(
                "support.views.EmailMessage.send",
                side_effect=OSError("mail server unavailable"),
            ):
                response = self.client.post(
                    self.url,
                    self.payload,
                    format="json",
                )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request = SupportRequest.objects.get()
        self.assertEqual(
            request.delivery_status,
            SupportRequest.DeliveryStatus.FAILED,
        )
        self.assertIsNone(request.email_sent_at)
        self.assertEqual(response.data["delivery_status"], "failed")
        self.assertEqual(mail.outbox, [])

    @override_settings(SUPPORT_EMAIL="")
    def test_missing_support_recipient_keeps_request_as_failed(self):
        with self.assertLogs("support", level="ERROR"):
            response = self.client.post(
                self.url,
                self.payload,
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request = SupportRequest.objects.get()
        self.assertEqual(
            request.delivery_status,
            SupportRequest.DeliveryStatus.FAILED,
        )
        self.assertEqual(response.data["support_email"], "")
        self.assertEqual(mail.outbox, [])

    def test_user_is_throttled_after_five_requests_per_hour(self):
        responses = [
            self.client.post(
                self.url,
                {**self.payload, "message": f"Message {number}"},
                format="json",
            )
            for number in range(6)
        ]

        self.assertEqual(
            [response.status_code for response in responses],
            [status.HTTP_201_CREATED] * 5 + [status.HTTP_429_TOO_MANY_REQUESTS],
        )
        self.assertEqual(SupportRequest.objects.count(), 5)
        self.assertEqual(len(mail.outbox), 5)
