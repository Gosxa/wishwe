from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from event.models import Event, EventType, Category
from notifications.models import Notification
from user.models import Profile


class NotificationViewSetTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@test.com",
            password="testpass123",
        )

        self.user_profile = Profile.objects.create(
            user=self.user,
            username="user",
        )

        self.other_user = get_user_model().objects.create_user(
            email="other@test.com",
            password="testpass123",
        )

        self.other_user_profile = Profile.objects.create(
            user=self.other_user,
            username="anotheruser",
        )

        self.category = Category.objects.create(
            name="Movies",
        )

        self.event = Event.objects.create(
            creator=self.other_user,
            title="Test Event",
            description="Test description",
            location="Kharkiv",
            event_type=EventType.WISH,
            category=self.category,
            timeframe_text="test date"
        )

        self.notification = Notification.objects.create(
            recipient=self.user,
            creator=self.other_user,
            title="Test notification",
            message="Test message",
            type="friend_request",
            related_object_type="event",
            related_object_id=self.event.id,
        )

        self.other_notification = Notification.objects.create(
            recipient=self.other_user,
            creator=self.user,
            title="Other notification",
            message="Other message",
            type="friend_request",
            related_object_type="event",
            related_object_id=self.event.id,
        )

        self.client.force_authenticate(self.user)

    def test_user_can_get_own_notifications(self):
        url = reverse("notifications:notifications-list")

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_user_cannot_see_other_users_notifications(self):
        url = reverse("notifications:notifications-list")

        response = self.client.get(url)

        notification_ids = [
            item["id"]
            for item in response.data["results"]
        ]

        self.assertIn(
            self.notification.id,
            notification_ids,
        )

        self.assertNotIn(
            self.other_notification.id,
            notification_ids,
        )

    def test_user_can_retrieve_own_notification(self):
        url = reverse(
            "notifications:notifications-detail",
            kwargs={"pk": self.notification.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["id"],
            self.notification.id,
        )

    def test_user_cannot_retrieve_other_notification(self):
        url = reverse(
            "notifications:notifications-detail",
            kwargs={"pk": self.other_notification.id},
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_mark_as_read(self):
        url = reverse(
            "notifications:notifications-mark-as-read",
            kwargs={"pk": self.notification.id},
        )

        response = self.client.post(url)

        self.notification.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(self.notification.is_read)

    def test_read_all(self):
        Notification.objects.create(
            recipient=self.user,
            creator=self.other_user,
            title="Second notification",
            message="Test message",
            type="friend_request",
            related_object_type="event",
            related_object_id=self.event.id,
        )

        url = reverse(
            "notifications:notifications-read-all",
        )

        response = self.client.post(url)

        unread_exists = Notification.objects.filter(
            recipient=self.user,
            is_read=False,
        ).exists()

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(unread_exists)

    def test_filter_read_notifications(self):
        self.notification.is_read = True
        self.notification.save(update_fields=["is_read"])

        url = reverse("notifications:notifications-list")

        response = self.client.get(
            url,
            {"read": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_filter_unread_notifications(self):
        url = reverse("notifications:notifications-list")

        response = self.client.get(
            url,
            {"read": "false"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_unauthorized_user_cannot_access_notifications(self):
        self.client.force_authenticate(None)

        url = reverse("notifications:notifications-list")

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
