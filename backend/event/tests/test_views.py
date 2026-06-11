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

from user.models import (
    Friendship,
    FriendshipStatus,
)

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

        self.plan_event = Event.objects.create(
            creator=self.friend,
            event_type=EventType.PLAN,
            title="Plan event",
            description="desc",
            location="Kyiv",
            event_date="2026-07-20",
            event_time="18:00",
            min_participants=2,
            max_participants=5,
            participants_count=1,
            status=EventStatus.ACTIVE,
        )

        self.completed_event = Event.objects.create(
            creator=self.friend,
            event_type=EventType.PLAN,
            title="Completed event",
            description="desc",
            location="Kyiv",
            event_date="2026-07-20",
            event_time="18:00",
            min_participants=2,
            max_participants=5,
            participants_count=1,
            status=EventStatus.COMPLETED,
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
            for event in response.data["results"]
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
            for event in response.data["results"]
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
            for event in response.data["results"]
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

        for event in response.data["results"]:
            self.assertEqual(
                event["event_type"],
                EventType.WISH,
            )

    def test_filter_only_plans(self):
        response = self.client.get(
            reverse("events:event-list"),
            {"type": EventType.PLAN},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        for event in response.data["results"]:
            self.assertEqual(
                event["event_type"],
                EventType.PLAN,
            )

    def test_completed_events_not_visible_in_feed(self):
        response = self.client.get(
            reverse("events:event-list")
        )

        titles = [
            event["title"]
            for event in response.data["results"]
        ]

        self.assertNotIn(
            self.completed_event.title,
            titles,
        )

    def test_search_by_title(self):
        response = self.client.get(
            reverse("events:event-list"),
            {"title": "Friend"},
        )

        titles = [
            event["title"]
            for event in response.data["results"]
        ]

        self.assertIn(
            self.friend_event.title,
            titles,
        )

        self.assertNotIn(
            self.fof_event.title,
            titles,
        )

    def test_mine_returns_own_and_participated_events(self):
        own_event = Event.objects.create(
            creator=self.user,
            event_type=EventType.WISH,
            title="My own wish",
            description="desc",
            location="Kyiv",
            timeframe_text="Someday",
            status=EventStatus.ACTIVE,
        )

        EventParticipant.objects.create(
            event=self.plan_event,
            user=self.user,
            status=ParticipationStatus.JOINED,
        )

        response = self.client.get(
            reverse("events:event-list"),
            {"mine": "true"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        titles = [
            event["title"]
            for event in response.data["results"]
        ]

        self.assertIn(own_event.title, titles)
        self.assertIn(self.plan_event.title, titles)

        # Friend's event the user does not participate in is excluded.
        self.assertNotIn(self.friend_event.title, titles)
        self.assertNotIn(self.stranger_event.title, titles)

    def test_join_plan(self):
        response = self.client.post(
            reverse(
                "events:event-join-plan",
                args=[self.plan_event.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.plan_event.refresh_from_db()

        self.assertEqual(
            self.plan_event.participants_count,
            2,
        )

        participant = EventParticipant.objects.get(
            event=self.plan_event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.JOINED,
        )

        self.assertEqual(
            response.data["user_participation_status"],
            ParticipationStatus.JOINED,
        )

    def test_interested_in_wish(self):
        response = self.client.post(
            reverse(
                "events:event-interested-in-wish",
                args=[self.friend_event.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.friend_event.refresh_from_db()

        self.assertEqual(
            self.friend_event.interested_count,
            1,
        )

        participant = EventParticipant.objects.get(
            event=self.friend_event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.INTERESTED,
        )

        self.assertEqual(
            response.data["user_participation_status"],
            ParticipationStatus.INTERESTED,
        )

    def test_leave_event(self):
        EventParticipant.objects.create(
            event=self.plan_event,
            user=self.user,
            status=ParticipationStatus.JOINED,
        )

        self.plan_event.participants_count = 2
        self.plan_event.save()

        response = self.client.post(
            reverse(
                "events:event-leave-event",
                args=[self.plan_event.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.plan_event.refresh_from_db()

        self.assertEqual(
            self.plan_event.participants_count,
            1,
        )

        participant = EventParticipant.objects.get(
            event=self.plan_event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.LEFT,
        )

        self.assertIsNone(
            response.data["user_participation_status"],
        )

    def test_copy_wish(self):
        response = self.client.post(
            reverse(
                "events:event-copy-wish",
                args=[self.friend_event.id],
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        copied_event = Event.objects.get(
            creator=self.user,
            title=self.friend_event.title,
        )

        self.assertEqual(
            copied_event.event_type,
            EventType.WISH,
        )

    def test_convert_wish_to_plan(self):
        own_wish = Event.objects.create(
            creator=self.user,
            event_type=EventType.WISH,
            title="Wish",
            description="desc",
            location="Kyiv",
            timeframe_text="Tomorrow",
            status=EventStatus.ACTIVE,
            interested_count=1,
        )

        EventParticipant.objects.create(
            event=own_wish,
            user=self.user,
            status=ParticipationStatus.INTERESTED,
        )

        response = self.client.post(
            reverse(
                "events:event-convert-to-plan",
                args=[own_wish.id],
            ),
            {
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        own_wish.refresh_from_db()

        self.assertEqual(
            own_wish.event_type,
            EventType.PLAN,
        )

        self.assertEqual(
            own_wish.participants_count,
            1,
        )

    def test_feed_is_paginated(self):
        response = self.client.get(
            reverse("events:event-list")
        )

        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)

    def test_list_user_participation_status(self):
        EventParticipant.objects.create(
            event=self.plan_event,
            user=self.user,
            status=ParticipationStatus.JOINED,
        )

        response = self.client.get(
            reverse("events:event-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        by_title = {
            event["title"]: event["user_participation_status"]
            for event in response.data["results"]
        }

        self.assertEqual(
            by_title[self.plan_event.title],
            ParticipationStatus.JOINED,
        )

        self.assertIsNone(
            by_title[self.friend_event.title],
        )

    def test_list_no_n_plus_one_for_participation_status(self):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        EventParticipant.objects.create(
            event=self.plan_event,
            user=self.user,
            status=ParticipationStatus.JOINED,
        )

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(
                reverse("events:event-list")
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        baseline = len(ctx.captured_queries)

        for i in range(5):
            Event.objects.create(
                creator=self.friend,
                event_type=EventType.WISH,
                title=f"Extra event {i}",
                description="desc",
                location="Kyiv",
                timeframe_text="Soon",
                status=EventStatus.ACTIVE,
            )

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(
                reverse("events:event-list")
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(ctx.captured_queries),
            baseline,
        )
