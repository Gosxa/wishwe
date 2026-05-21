from django.contrib.auth import get_user_model
from django.test import TestCase

from event.serializers import (
    WishWriteSerializer,
    PlanWriteSerializer, ConvertWishToPlanSerializer,
)

from event.models import EventStatus, Event, EventType


class WishWriteSerializerTests(TestCase):
    def test_wish_requires_timeframe(self):
        serializer = WishWriteSerializer(
            data={
                "title": "Cinema",
                "description": "Movie",
                "location": "Kyiv",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "timeframe_text",
            serializer.errors,
        )


class PlanWriteSerializerTests(TestCase):
    def test_plan_requires_event_date(self):
        serializer = PlanWriteSerializer(
            data={
                "title": "Games",
                "description": "Board games",
                "location": "Kharkiv",
                "event_time": "19:00",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "event_date",
            serializer.errors,
        )

    def test_plan_requires_event_time(self):
        serializer = PlanWriteSerializer(
            data={
                "title": "Games",
                "description": "Board games",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "min_participants": 2,
                "max_participants": 5,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "event_time",
            serializer.errors,
        )

    def test_plan_max_participants_cannot_be_less_than_min(self):
        serializer = PlanWriteSerializer(
            data={
                "title": "Games",
                "description": "Board games",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "19:00",
                "min_participants": 5,
                "max_participants": 2,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "max_participants",
            serializer.errors,
        )

    def test_plan_requires_at_least_two_participants(self):
        serializer = PlanWriteSerializer(
            data={
                "title": "Games",
                "description": "Board games",
                "location": "Kharkiv",
                "event_date": "2026-07-20",
                "event_time": "19:00",
                "min_participants": 1,
                "max_participants": 1,
            }
        )

        self.assertFalse(serializer.is_valid())

        self.assertIn(
            "max_participants",
            serializer.errors,
        )

    def test_completed_plan_cannot_be_updated(self):
        event = Event.objects.create(
            creator=get_user_model().objects.create(
                email="testuser@gmail.com",
                password="testpassword124",
                is_verified=True
            ),
            event_type=EventType.PLAN,
            status=EventStatus.COMPLETED,
            title="Games",
            description="desc",
            location="Kharkiv",
            event_date="2026-07-20",
            event_time="19:00",
            min_participants=2,
            max_participants=5,
        )

        serializer = PlanWriteSerializer(
            instance=event,
            data={
                "title": "Updated",
            },
            partial=True,
        )

        self.assertFalse(serializer.is_valid())

        self.assertIn(
            "non_field_errors",
            serializer.errors,
        )


class ConvertWishToPlanSerializerTests(TestCase):
    def test_max_participants_cannot_be_less_than_min(self):
        serializer = ConvertWishToPlanSerializer(
            data={
                "event_date": "2026-07-20",
                "event_time": "19:00",
                "min_participants": 5,
                "max_participants": 2,
            }
        )

        self.assertFalse(serializer.is_valid())

        self.assertIn(
            "max_participants",
            serializer.errors,
        )

    def test_plan_requires_at_least_two_participants(self):
        serializer = ConvertWishToPlanSerializer(
            data={
                "event_date": "2026-07-20",
                "event_time": "19:00",
                "min_participants": 1,
                "max_participants": 1,
            }
        )

        self.assertFalse(serializer.is_valid())

        self.assertIn(
            "max_participants",
            serializer.errors,
        )
