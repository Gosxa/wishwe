from django.db import transaction

from event.models import (
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus,
)


class EventService:
    @staticmethod
    @transaction.atomic
    def create_wish(*, creator, validated_data):
        event = Event.objects.create(
            creator=creator,
            event_type=EventType.WISH,
            **validated_data,
        )

        EventParticipant.objects.create(
            event=event,
            user=creator,
            status=ParticipationStatus.INTERESTED,
        )

        event.interested_count = 1
        event.save(update_fields=["interested_count"])

        return event

    @staticmethod
    @transaction.atomic
    def create_plan(*, creator, validated_data):
        event = Event.objects.create(
            creator=creator,
            event_type=EventType.PLAN,
            participants_count=1,
            **validated_data,
        )

        EventParticipant.objects.create(
            event=event,
            user=creator,
            status=ParticipationStatus.JOINED,
        )

        return event

    @staticmethod
    def _close_if_full(event):
        if event.is_full:
            event.status = EventStatus.CLOSED
            event.save(update_fields=["status"])
