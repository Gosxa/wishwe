import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase

from event.models import (
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus,
)

from event.services.event_service import EventService

User = get_user_model()


class EventServiceTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@test.com",
            password="testpass123",
        )

        self.second_user = User.objects.create_user(
            email="second@test.com",
            password="testpass123",
        )

    def test_create_wish(self):
        event = EventService.create_wish(
            creator=self.user,
            validated_data={
                "title": "Go to cinema",
                "description": "Lets watch movie",
                "location": "Kyiv",
                "timeframe_text": "Next weekend",
            }
        )

        self.assertEqual(event.creator, self.user)
        self.assertEqual(event.event_type, EventType.WISH)
        self.assertEqual(event.interested_count, 1)

        participant = EventParticipant.objects.get(
            event=event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.INTERESTED,
        )

    def test_create_plan(self):
        event = EventService.create_plan(
            creator=self.user,
            validated_data={
                "title": "Board games",
                "description": "Lets play",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        self.assertEqual(event.creator, self.user)
        self.assertEqual(event.event_type, EventType.PLAN)
        self.assertEqual(event.participants_count, 1)

        participant = EventParticipant.objects.get(
            event=event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.JOINED,
        )

    def test_join_plan(self):
        event = EventService.create_plan(
            creator=self.user,
            validated_data={
                "title": "Board games",
                "description": "Lets play",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        updated_event = EventService.join_plan(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            updated_event.participants_count,
            2,
        )

        participant = EventParticipant.objects.get(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.JOINED,
        )

    def test_join_plan_closes_full_event(self):
        event = EventService.create_plan(
            creator=self.user,
            validated_data={
                "title": "Board games",
                "description": "Lets play",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 2,
            }
        )

        updated_event = EventService.join_plan(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            updated_event.status,
            EventStatus.CLOSED,
        )

    def test_interested_in_wish(self):
        event = EventService.create_wish(
            creator=self.user,
            validated_data={
                "title": "Cinema",
                "description": "Movie",
                "location": "Kyiv",
                "timeframe_text": "Weekend",
            }
        )

        updated_event = EventService.interested_in_wish(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            updated_event.interested_count,
            2,
        )

        participant = EventParticipant.objects.get(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.INTERESTED,
        )

    def test_leave_plan(self):
        event = EventService.create_plan(
            creator=self.user,
            validated_data={
                "title": "Games",
                "description": "desc",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        EventService.join_plan(
            event=event,
            user=self.second_user,
        )

        updated_event = EventService.leave_event(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            updated_event.participants_count,
            1,
        )

        participant = EventParticipant.objects.get(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.LEFT,
        )

    def test_leave_reopens_closed_event(self):
        event = EventService.create_plan(
            creator=self.user,
            validated_data={
                "title": "Games",
                "description": "desc",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "18:00",
                "min_participants": 2,
                "max_participants": 2,
            }
        )

        EventService.join_plan(
            event=event,
            user=self.second_user,
        )

        event.refresh_from_db()

        self.assertEqual(
            event.status,
            EventStatus.CLOSED,
        )

        updated_event = EventService.leave_event(
            event=event,
            user=self.second_user,
        )

        self.assertEqual(
            updated_event.status,
            EventStatus.ACTIVE,
        )

    def test_convert_wish_to_plan(self):
        event = EventService.create_wish(
            creator=self.user,
            validated_data={
                "title": "Cinema",
                "description": "Movie",
                "location": "Kyiv",
                "timeframe_text": "Weekend",
            }
        )

        updated_event = EventService.convert_wish_to_plan(
            event=event,
            validated_data={
                "event_date": datetime.date.today(),
                "event_time": datetime.time(15, 0, 0),
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        self.assertEqual(
            updated_event.event_type,
            EventType.PLAN,
        )

        self.assertEqual(
            updated_event.participants_count,
            1,
        )

        self.assertEqual(
            updated_event.interested_count,
            0,
        )

        participant = EventParticipant.objects.get(
            event=event,
            user=self.user,
        )

        self.assertEqual(
            participant.status,
            ParticipationStatus.JOINED,
        )

    def test_copy_wish(self):
        original_event = EventService.create_wish(
            creator=self.user,
            validated_data={
                "title": "Cinema",
                "description": "Movie",
                "location": "Kyiv",
                "timeframe_text": "Weekend",
            }
        )

        copied_event = EventService.copy_wish(
            event=original_event,
            user=self.second_user,
        )

        self.assertEqual(
            copied_event.creator,
            self.second_user,
        )

        self.assertEqual(
            copied_event.title,
            original_event.title,
        )

        self.assertEqual(
            copied_event.interested_count,
            1,
        )
