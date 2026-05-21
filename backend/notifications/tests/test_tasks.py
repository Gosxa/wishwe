from datetime import date, time

from django.contrib.auth import get_user_model
from django.test import TestCase

from event.models import (
    Event,
    EventParticipant,
    EventType,
    ParticipationStatus,
    Category
)
from notifications.models import (
    Notification,
    NotificationType,
)
from notifications.tasks import (
    send_event_start_reminder_notifications,
)
from user.models import Profile


class NotificationTasksTests(TestCase):

    def setUp(self):
        self.creator = get_user_model().objects.create_user(
            email="creator@test.com",
            password="testpass123",
        )

        self.interested_user = get_user_model().objects.create_user(
            email="interested@test.com",
            password="testpass123",
        )

        self.interested_profile = Profile.objects.create(
            user=self.interested_user,
            username="interested",
        )

        self.joined_user = get_user_model().objects.create_user(
            email="joined@test.com",
            password="testpass123",
        )

        self.joined_profile = Profile.objects.create(
            user=self.joined_user,
            username="joined",
        )

        self.category = Category.objects.create(
            name="Movies",
        )

        self.event = Event.objects.create(
            creator=self.creator,
            title="Test Event",
            description="Test description",
            location="Kharkiv",
            event_type=EventType.PLAN,
            category=self.category,
            event_date=date.today(),
            event_time=time(hour=18, minute=0),
            min_participants=5,
            max_participants=10,
        )

        EventParticipant.objects.create(
            event=self.event,
            user=self.interested_user,
            status=ParticipationStatus.INTERESTED,
        )

        EventParticipant.objects.create(
            event=self.event,
            user=self.joined_user,
            status=ParticipationStatus.JOINED,
        )

    def test_send_event_start_reminder_notifications(self):
        send_event_start_reminder_notifications(
            event_id=self.event.id,
        )

        notifications = Notification.objects.all()

        self.assertEqual(
            notifications.count(),
            1,
        )

        notification = notifications.first()

        self.assertEqual(
            notification.recipient,
            self.interested_user,
        )

        self.assertEqual(
            notification.creator,
            self.creator,
        )

        self.assertEqual(
            notification.type,
            NotificationType.EVENT_START_REMINDER,
        )

    def test_task_does_not_notify_joined_users(self):
        send_event_start_reminder_notifications(
            event_id=self.event.id,
        )

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.joined_user,
            ).exists()
        )

    def test_task_does_not_notify_creator(self):
        EventParticipant.objects.create(
            event=self.event,
            user=self.creator,
            status=ParticipationStatus.INTERESTED,
        )

        send_event_start_reminder_notifications(
            event_id=self.event.id,
        )

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.creator,
            ).exists()
        )

    def test_task_handles_deleted_event(self):
        event_id = self.event.id

        self.event.delete()

        send_event_start_reminder_notifications(
            event_id=event_id,
        )

        self.assertEqual(
            Notification.objects.count(),
            0,
        )
