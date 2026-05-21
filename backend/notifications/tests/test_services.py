from django.contrib.auth import get_user_model
from django.test import TestCase

from event.models import Event, EventType, Category
from notifications.models import (
    Notification,
    NotificationType,
    RelatedObjectType,
)
from notifications.services.notification_service import NotificationService
from user.models import Friendship, Profile


class NotificationServiceTests(TestCase):
    def setUp(self):
        self.sender = get_user_model().objects.create_user(
            email="sender@test.com",
            password="testpass123",
        )

        self.receiver = get_user_model().objects.create_user(
            email="receiver@test.com",
            password="testpass123",
        )

        self.profile = Profile.objects.create(
            user=self.sender,
            username="sender",
        )

        self.profile2 = Profile.objects.create(
            user=self.receiver,
            username="receiver",
        )

        self.event_creator = get_user_model().objects.create_user(
            email="creator@test.com",
            password="testpass123",
        )

        self.category = Category.objects.create(
            name="Movies",
        )

        self.friendship = Friendship.objects.create(
            sender=self.sender,
            receiver=self.receiver,
        )

        self.event = Event.objects.create(
            creator=self.event_creator,
            title="Test Event",
            description="Test description",
            location="Kharkiv",
            event_type=EventType.WISH,
            category=self.category,
            timeframe_text="Sometime in June"
        )

    def test_create_friend_request_notification(self):
        NotificationService.create_friend_request_notification(
            friendship=self.friendship,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.recipient,
            self.receiver,
        )

        self.assertEqual(
            notification.creator,
            self.sender,
        )

        self.assertEqual(
            notification.type,
            NotificationType.FRIEND_REQUEST,
        )

        self.assertEqual(
            notification.related_object_type,
            RelatedObjectType.FRIENDSHIP,
        )

        self.assertEqual(
            notification.related_object_id,
            self.friendship.id,
        )

        self.assertFalse(notification.is_read)

    def test_create_friend_request_accepted_notification(self):
        NotificationService.create_friend_request_accepted_notification(
            friendship=self.friendship,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.recipient,
            self.sender,
        )

        self.assertEqual(
            notification.creator,
            self.receiver,
        )

        self.assertEqual(
            notification.type,
            NotificationType.FRIEND_REQUEST_ACCEPTED,
        )

    def test_create_joined_event_notification(self):
        NotificationService.create_joined_event_notification(
            user=self.sender,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.recipient,
            self.event_creator,
        )

        self.assertEqual(
            notification.creator,
            self.sender,
        )

        self.assertEqual(
            notification.type,
            NotificationType.JOINED_EVENT,
        )

        self.assertEqual(
            notification.related_object_type,
            RelatedObjectType.EVENT,
        )

        self.assertEqual(
            notification.related_object_id,
            self.event.id,
        )

    def test_create_interested_event_notification(self):
        NotificationService.create_interested_event_notification(
            user=self.sender,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.recipient,
            self.event_creator,
        )

        self.assertEqual(
            notification.creator,
            self.sender,
        )

        self.assertEqual(
            notification.type,
            NotificationType.INTERESTED_EVENT,
        )

    def test_create_event_planned_notification(self):
        NotificationService.create_event_planned_notification(
            recipient=self.receiver,
            creator=self.event_creator,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.recipient,
            self.receiver,
        )

        self.assertEqual(
            notification.creator,
            self.event_creator,
        )

        self.assertEqual(
            notification.type,
            NotificationType.EVENT_PLANNED,
        )

    def test_create_event_updated_notification(self):
        NotificationService.create_event_updated_notification(
            recipient=self.receiver,
            creator=self.event_creator,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.type,
            NotificationType.EVENT_UPDATED,
        )

    def test_create_event_cancelled_notification(self):
        NotificationService.create_event_cancelled_notification(
            recipient=self.receiver,
            creator=self.event_creator,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.type,
            NotificationType.EVENT_CANCELLED,
        )

    def test_create_event_start_reminder_notification(self):
        NotificationService.create_event_start_reminder_notification(
            recipient=self.receiver,
            creator=self.event_creator,
            event=self.event,
        )

        notification = Notification.objects.get()

        self.assertEqual(
            notification.type,
            NotificationType.EVENT_START_REMINDER,
        )

    def test_notifications_created_count(self):
        NotificationService.create_joined_event_notification(
            user=self.sender,
            event=self.event,
        )

        NotificationService.create_interested_event_notification(
            user=self.receiver,
            event=self.event,
        )

        self.assertEqual(
            Notification.objects.count(),
            2,
        )
