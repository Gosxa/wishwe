import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    def __str__(self):
        return self.name


class EventType(models.TextChoices):
    WISH = "wish", "Wish"
    PLAN = "plan", "Plan"


class EventVisibility(models.TextChoices):
    FRIENDS_OF_FRIENDS = "f-o-f", "F-O-F"
    FRIENDS = "friends-only", "FRIENDS-ONLY"


class EventStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"
    COMPLETED = "completed", "Completed"


def upload_cover_image(instance, filename):
    """Upload an event picture."""
    ext = filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"

    return os.path.join("uploads/events/", filename)


class Event(models.Model):
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_events",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    event_type = models.CharField(
        max_length=10,
        choices=EventType.choices,
    )
    event_visibility = models.CharField(
        max_length=15,
        choices=EventVisibility.choices,
        default=EventVisibility.FRIENDS_OF_FRIENDS,
    )
    title = models.CharField(
        max_length=50,
    )
    description = models.CharField(
        max_length=200,
        default="No details added by the host."
    )
    cover_image = models.ImageField(
        upload_to=upload_cover_image,
        blank=True,
        null=True,
    )
    location = models.CharField(
        max_length=255,
    )
    external_link = models.URLField(
        blank=True,
        null=True,
    )
    event_date = models.DateField(
        blank=True,
        null=True,
    )
    event_time = models.TimeField(
        blank=True,
        null=True,
    )
    timeframe_text = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    min_participants = models.PositiveIntegerField(
        default=1,
    )
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    participants_count = models.PositiveIntegerField(
        default=0,
    )
    interested_count = models.PositiveIntegerField(
        default=0,
    )
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.ACTIVE,
    )
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["creator"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["status"]),
            models.Index(fields=["event_date"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()

        if self.event_type == EventType.WISH:
            if not self.timeframe_text:
                raise ValidationError({
                    "timeframe_text": "Wish events require timeframe_text."
                })

        elif self.event_type == EventType.PLAN:
            if not self.event_date:
                raise ValidationError({
                    "event_date": "Plan events require event_date."
                })

            if not self.event_time:
                raise ValidationError({
                    "event_time": "Plan events require event_time."
                })

            if self.max_participants is None:
                raise ValidationError({
                    "max_participants":
                        "Plan events require max_participants."
                })

            if self.max_participants < self.min_participants:
                raise ValidationError({
                    "max_participants":
                        "max_participants cannot be less than min_participants."
                })

            if self.participants_count > self.max_participants:
                raise ValidationError({
                    "participants_count":
                        "participants_count cannot exceed max_participants."
                })

        if (
                self.status == EventStatus.COMPLETED
                and self.event_type == EventType.WISH
        ):
            raise ValidationError({
                "status": "Wish events cannot be completed."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    @property
    def is_wish(self):
        return self.event_type == EventType.WISH

    @property
    def is_plan(self):
        return self.event_type == EventType.PLAN

    @property
    def is_full(self):
        if self.is_wish:
            return False
        return self.participants_count >= self.max_participants

    @property
    def is_expired(self):
        return self.expires_at and self.expires_at < timezone.now()

    @property
    def available_spots(self):
        if self.is_wish:
            return None
        return max(0, self.max_participants - self.participants_count)

    @property
    def can_join(self):
        return (
                self.status == EventStatus.ACTIVE
                and not self.is_full
                and not self.is_expired
        )


class ParticipationStatus(models.TextChoices):
    INTERESTED = "interested", "Interested"
    JOINED = "joined", "Joined"
    LEFT = "left", "Left"


class EventParticipant(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_participations",
    )
    status = models.CharField(
        max_length=20,
        choices=ParticipationStatus.choices,
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "user"],
                name="unique_event_user",
            )
        ]

        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.user} -> {self.event}"
