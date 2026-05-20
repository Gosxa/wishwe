from datetime import datetime, timedelta
from django.utils import timezone

from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError

from event.models import (
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus,
)
from notifications.services.notification_service import NotificationService
from user.models import FriendshipStatus, Friendship


class EventService:
    @staticmethod
    def calculate_plan_expiration(*, event_date, event_time,):
        event_datetime = datetime.combine(
            event_date,
            event_time,
        )
        aware_event_datetime = timezone.make_aware(
            event_datetime,
            timezone.get_current_timezone(),
        )

        return aware_event_datetime + timedelta(minutes=5)

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

        event.expires_at = EventService.calculate_plan_expiration(
            event_date=event.event_date,
            event_time=event.event_time,
        )
        event.save(update_fields=["expires_at"])

        return event

    @staticmethod
    def get_user_friend_ids(user):
        friendships = Friendship.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status=FriendshipStatus.ACCEPTED,
        ).values_list(
            "sender_id",
            "receiver_id",
        )

        friend_ids = set()

        for sender_id, receiver_id in friendships:

            if sender_id == user.id:
                friend_ids.add(receiver_id)
            else:
                friend_ids.add(sender_id)

        return friend_ids

    @staticmethod
    def get_visible_users_ids(user):
        visible_users_ids = {user.id}

        friend_ids = EventService.get_user_friend_ids(user)
        visible_users_ids.update(friend_ids)

        friendships = Friendship.objects.filter(
            Q(sender_id__in=friend_ids)
            | Q(receiver_id__in=friend_ids),
            status=FriendshipStatus.ACCEPTED,
        ).values_list(
            "sender_id",
            "receiver_id",
        )

        for sender_id, receiver_id in friendships:
            visible_users_ids.add(sender_id)
            visible_users_ids.add(receiver_id)

        return visible_users_ids

    @staticmethod
    def _validate_wish_event(event):
        if event.event_type != EventType.WISH:
            raise ValidationError(
                "This action is available only for wish events."
            )

    @staticmethod
    def _validate_plan_event(event):
        if event.event_type != EventType.PLAN:
            raise ValidationError(
                "This action is available only for plan events."
            )

    @staticmethod
    @transaction.atomic
    def update_wish(*, event, validated_data):
        EventService._validate_wish_event(event)
        for field, value in validated_data.items():
            setattr(event, field, value)

        event.save()

        return event

    @staticmethod
    @transaction.atomic
    def update_plan(*, event, validated_data):
        EventService._validate_plan_event(event)
        for field, value in validated_data.items():
            setattr(event, field, value)

        event.save()

        return event

    @staticmethod
    def _validate_active_event(event):
        if event.status != EventStatus.ACTIVE:
            raise ValidationError(
                "Only active events can be joined."
            )

    @staticmethod
    @transaction.atomic
    def join_plan(*, event, user):
        EventService._validate_plan_event(event)
        EventService._validate_active_event(event)

        if event.is_full:
            raise ValidationError(
                "Event is already full."
            )

        participant, created = (
            EventParticipant.objects.get_or_create(
                event=event,
                user=user,
                defaults={
                    "status": ParticipationStatus.JOINED,
                }
            )
        )

        if (
            not created
            and participant.status == ParticipationStatus.JOINED
        ):
            raise ValidationError(
                "User already joined this event."
            )

        if not created:
            participant.status = ParticipationStatus.JOINED
            participant.save(update_fields=["status"])

        event.participants_count += 1

        if event.is_full:
            event.status = EventStatus.CLOSED

        event.save(
            update_fields=[
                "participants_count",
                "status",
            ]
        )

        NotificationService.create_joined_event_notification(
            event=event, user=user
        )

        return event

    @staticmethod
    @transaction.atomic
    def interested_in_wish(*, event, user):
        EventService._validate_wish_event(event)
        EventService._validate_active_event(event)

        participant, created = (
            EventParticipant.objects.get_or_create(
                event=event,
                user=user,
                defaults={
                    "status": ParticipationStatus.INTERESTED,
                }
            )
        )

        if (
            not created
            and participant.status == ParticipationStatus.INTERESTED
        ):
            raise ValidationError(
                "User already interested in this wish."
            )

        if not created:
            participant.status = (
                ParticipationStatus.INTERESTED
            )

            participant.save(
                update_fields=["status"]
            )

        event.interested_count += 1
        event.save(
            update_fields=["interested_count"]
        )

        NotificationService.create_interested_event_notification(
            event=event, user=user
        )

        return event

    @staticmethod
    @transaction.atomic
    def leave_event(*, event, user):
        participant = EventParticipant.objects.filter(
            event=event,
            user=user,
        ).first()

        if not participant:
            raise ValidationError(
                "User is not participating in this event."
            )

        if participant.status == ParticipationStatus.LEFT:
            raise ValidationError(
                "User already left this event."
            )

        if participant.status == ParticipationStatus.JOINED:
            if event.participants_count > 0:
                event.participants_count -= 1

            if (
                    event.status == EventStatus.CLOSED
                    and not event.is_full
            ):
                event.status = EventStatus.ACTIVE

            event.save(
                update_fields=[
                    "participants_count",
                    "status",
                ]
            )
        elif participant.status == ParticipationStatus.INTERESTED:

            if event.interested_count > 0:
                event.interested_count -= 1

            event.save(
                update_fields=["interested_count"]
            )

        participant.status = ParticipationStatus.LEFT
        participant.save(update_fields=["status"])

        return event

    @staticmethod
    @transaction.atomic
    def convert_wish_to_plan(*, event, validated_data,):
        EventService._validate_wish_event(event)
        EventService._validate_active_event(event)

        event.event_type = EventType.PLAN
        event.event_date = validated_data["event_date"]
        event.event_time = validated_data["event_time"]
        event.min_participants = (validated_data["min_participants"])
        event.max_participants = (validated_data["max_participants"])
        event.participants_count = 1
        event.interested_count -= 1
        event.expires_at = EventService.calculate_plan_expiration(
            event_date=event.event_date,
            event_time=event.event_time,
        )
        event.save()

        creator_participant = (
            EventParticipant.objects.get(
                event=event,
                user=event.creator,
            )
        )
        creator_participant.status = ParticipationStatus.JOINED
        creator_participant.save(update_fields=["status"])

        return event

    @staticmethod
    @transaction.atomic
    def copy_wish(*, event, user):
        EventService._validate_wish_event(event)

        if event.creator == user:
            raise ValidationError(
                "Users cannot copy their own wishes."
            )

        copied_event = Event.objects.create(
            creator=user,
            category=event.category,
            event_type=EventType.WISH,
            title=event.title,
            description=event.description,
            cover_image=event.cover_image,
            location=event.location,
            external_link=event.external_link,
            timeframe_text=event.timeframe_text,
            expires_at=event.expires_at,
            interested_count=1,
        )

        EventParticipant.objects.create(
            event=copied_event,
            user=user,
            status=ParticipationStatus.INTERESTED,
        )

        return copied_event
