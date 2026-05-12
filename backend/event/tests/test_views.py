from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from event.models import Event, EventStatus, EventType
from user.models import Friendship, FriendshipStatus

User = get_user_model()


class EventFeedTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@test.com",
            password="testpass123",
        )

        self.friend = User.objects.create_user(
            email="friend@test.com",
            password="testpass123",
        )

        self.friend_of_friend = User.objects.create_user(
            email="fof@test.com",
            password="testpass123",
        )

        self.stranger = User.objects.create_user(
            email="stranger@test.com",
            password="testpass123",
        )

        Friendship.objects.create(
            sender=self.user,
            receiver=self.friend,
            status=FriendshipStatus.ACCEPTED,
        )

        Friendship.objects.create(
            sender=self.friend,
            receiver=self.friend_of_friend,
            status=FriendshipStatus.ACCEPTED,
        )

        self.friend_event = Event.objects.create(
            creator=self.friend,
            event_type=EventType.WISH,
            title="Friend event",
            description="desc",
            location="Kyiv",
            timeframe_text="Tomorrow",
            status=EventStatus.ACTIVE,
        )

        self.fof_event = Event.objects.create(
            creator=self.friend_of_friend,
            event_type=EventType.WISH,
            title="FOF event",
            description="desc",
            location="Kyiv",
            timeframe_text="Next week",
            status=EventStatus.ACTIVE,
        )

        self.stranger_event = Event.objects.create(
            creator=self.stranger,
            event_type=EventType.WISH,
            title="Stranger event",
            description="desc",
            location="Kyiv",
            timeframe_text="Never",
            status=EventStatus.ACTIVE,
        )

        self.client.force_authenticate(
            user=self.user
        )

    def test_user_sees_friend_event(self):
        response = self.client.get(
            reverse("events:event-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        titles = [
            event["title"]
            for event in response.data
        ]

        self.assertIn(
            self.friend_event.title,
            titles,
        )

    def test_user_sees_friend_of_friend_event(self):
        response = self.client.get(
            reverse("events:event-list")
        )

        titles = [
            event["title"]
            for event in response.data
        ]

        self.assertIn(
            self.fof_event.title,
            titles,
        )

    def test_user_does_not_see_stranger_event(self):
        response = self.client.get(
            reverse("events:event-list")
        )

        titles = [
            event["title"]
            for event in response.data
        ]

        self.assertNotIn(
            self.stranger_event.title,
            titles,
        )

    def test_filter_only_wishes(self):
        response = self.client.get(
            reverse("events:event-list"),
            {"type": EventType.WISH},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        for event in response.data:
            self.assertEqual(
                event["event_type"],
                EventType.WISH,
            )
