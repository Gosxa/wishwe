from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from event.models import (
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus,
)

User = get_user_model()


class UserEventsTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="user@test.com",
            password="testpass123",
        )

        self.friend = User.objects.create_user(
            email="friend@test.com",
            password="testpass123",
        )

        self.own_wish = Event.objects.create(
            creator=self.user,
            event_type=EventType.WISH,
            title="My own wish",
            description="desc",
            location="Kyiv",
            timeframe_text="Someday",
            status=EventStatus.ACTIVE,
        )

        self.joined_plan = Event.objects.create(
            creator=self.friend,
            event_type=EventType.PLAN,
            title="Joined plan",
            description="desc",
            location="Kyiv",
            event_date="2026-07-20",
            event_time="18:00",
            min_participants=2,
            max_participants=5,
            status=EventStatus.ACTIVE,
        )

        EventParticipant.objects.create(
            event=self.joined_plan,
            user=self.user,
            status=ParticipationStatus.JOINED,
        )

        self.left_plan = Event.objects.create(
            creator=self.friend,
            event_type=EventType.PLAN,
            title="Left plan",
            description="desc",
            location="Kyiv",
            event_date="2026-07-21",
            event_time="18:00",
            min_participants=2,
            max_participants=5,
            status=EventStatus.ACTIVE,
        )

        EventParticipant.objects.create(
            event=self.left_plan,
            user=self.user,
            status=ParticipationStatus.LEFT,
        )

        self.foreign_event = Event.objects.create(
            creator=self.friend,
            event_type=EventType.WISH,
            title="Foreign wish",
            description="desc",
            location="Kyiv",
            timeframe_text="Tomorrow",
            status=EventStatus.ACTIVE,
        )

        self.client.force_authenticate(user=self.user)

        self.url = reverse(
            "user:user-events",
            kwargs={"pk": self.user.pk},
        )

    def get_titles(self, params=None):
        response = self.client.get(self.url, params or {})

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        return [
            event["title"]
            for event in response.data["results"]
        ]

    def test_returns_own_and_participated_events(self):
        titles = self.get_titles()

        self.assertIn(self.own_wish.title, titles)
        self.assertIn(self.joined_plan.title, titles)

        # Events the user left or never participated in are excluded.
        self.assertNotIn(self.left_plan.title, titles)
        self.assertNotIn(self.foreign_event.title, titles)

    def test_tab_filters_by_event_type(self):
        self.assertEqual(
            self.get_titles({"tab": "plans"}),
            [self.joined_plan.title],
        )
        self.assertEqual(
            self.get_titles({"tab": "wishes"}),
            [self.own_wish.title],
        )

    def test_title_filter(self):
        self.assertEqual(
            self.get_titles({"title": "own"}),
            [self.own_wish.title],
        )
