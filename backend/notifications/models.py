from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    FRIEND_REQUEST = "friend_request", "Friend Request"
    FRIEND_REQUEST_ACCEPTED = (
        "friend_request_accepted",
        "Friend Request Accepted",
    )

    JOINED_EVENT = "joined_event", "Joined Event"
    INTERESTED_EVENT = "interested_event", "Interested Event"
    EVENT_CONFIRM_REMINDER = (
        "event_confirm_reminder",
        "Event Confirm Reminder",
    )

    EVENT_UPDATED = "event_updated", "Event Updated"
    EVENT_CANCELLED = "event_cancelled", "Event Cancelled"


class RelatedObjectType(models.TextChoices):
    EVENT = "event", "Event"
    FRIENDSHIP = "friendship", "Friendship"


class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_notifications",
    )
    type = models.CharField(
        max_length=64,
        choices=NotificationType.choices,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_object_id = models.PositiveIntegerField()
    related_object_type = models.CharField(
        max_length=32,
        choices=RelatedObjectType.choices,
    )
    is_read = models.BooleanField(
        default=False,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["recipient", "-created_at"],
            ),
            models.Index(
                fields=["recipient", "is_read"],
            ),
        ]

    def __str__(self):
        return self.title
