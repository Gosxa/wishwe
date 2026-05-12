from django.contrib.auth import get_user_model
from django.test import TestCase

from event.models import (
    Event,
    EventParticipant,
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
