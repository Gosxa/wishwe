import uuid

from django.conf import settings
from django.db import models


class SupportCategory(models.TextChoices):
    TECHNICAL_ISSUE = "technical_issue", "Technical issue"
    ACCOUNT_ACCESS = "account_access", "Account and sign-in"
    FEATURE_IDEA = "feature_idea", "Feature idea"
    FEEDBACK = "feedback", "Feedback"
    PRIVACY_DATA = "privacy_data", "Privacy or data request"
    SAFETY_REPORT = "safety_report", "Safety or abuse report"
    OTHER = "other", "Other"


class SupportRequest(models.Model):
    class DeliveryStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="support_requests",
        null=True,
        blank=True,
    )
    email = models.EmailField()
    display_name = models.CharField(max_length=100, blank=True)
    category = models.CharField(
        max_length=32,
        choices=SupportCategory.choices,
    )
    message = models.TextField(max_length=5000)
    delivery_status = models.CharField(
        max_length=12,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    email_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "support request"
        verbose_name_plural = "support requests"

    def __str__(self):
        return f"{self.get_category_display()} from {self.email}"
