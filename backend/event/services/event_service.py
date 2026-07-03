from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from django.db import transaction
from django.db.models import Q
from django.utils.timezone import make_aware
from rest_framework.exceptions import ValidationError

from event.models import (
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus, EventVisibility,
)
from notifications.services.notification_service import NotificationService
from notifications.tasks import send_event_start_reminder_notifications
from user.models import FriendshipStatus, Friendship
from user.services.friendship_service import FriendshipService

IMPORTANT_PLAN_FIELDS = {
    "event_date",
    "event_time",
    "location",
    "min_participants",
    "max_participants",
}


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
    def has_important_plan_changes(event, validated_data):
        for field in IMPORTANT_PLAN_FIELDS:
            if field in validated_data:
                old_value = getattr(event, field)
                new_value = validated_data[field]

                if old_value != new_value:
                    return True

        return False

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

        friend_ids = {user.id}

        for sender_id, receiver_id in friendships:
            if sender_id == user.id:
                friend_ids.add(receiver_id)
            else:
                friend_ids.add(sender_id)

        return friend_ids

    @staticmethod
    def get_friends_of_friends_ids(user, friend_ids):
        friendships = Friendship.objects.filter(
            Q(sender_id__in=friend_ids)
            | Q(receiver_id__in=friend_ids),
            status=FriendshipStatus.ACCEPTED,
        ).values_list(
            "sender_id",
            "receiver_id",
        )

        friends_of_friends = set()

        for sender_id, receiver_id in friendships:
            friends_of_friends.add(sender_id)
            friends_of_friends.add(receiver_id)

        friends_of_friends.discard(user.id)

        friends_of_friends -= friend_ids

        return friends_of_friends

    @staticmethod
    def get_mutual_friend(
            user_friend_ids,
            creator,
    ):
        creator_friend_ids = (
            EventService.get_user_friend_ids(
                creator
            )
        )

        mutual_friend_ids = (
                user_friend_ids
                & creator_friend_ids
        )

        if not mutual_friend_ids:
            return None

        mutual_friend_id = min(
            mutual_friend_ids
        )

        return (
            get_user_model()
            .objects
            .select_related("profile")
            .get(id=mutual_friend_id)
        )

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

        should_notify = EventService.has_important_plan_changes(
            event,
            validated_data,
        )

        for field, value in validated_data.items():
            setattr(event, field, value)

        event.save()

        if should_notify:
            event_participants = EventParticipant.objects.filter(
                event=event,
                status=ParticipationStatus.JOINED,
            ).select_related("user").exclude(user=event.creator)
            for participant in event_participants:
                NotificationService.create_event_updated_notification(
                    event=event,
                    recipient=participant.user,
                    creator=event.creator,
                )

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

        event_datetime = make_aware(
            datetime.combine(
                event.event_date,
                event.event_time,
            )
        )
        reminder_eta = event_datetime - timedelta(hours=24)

        if reminder_eta > timezone.now():
            send_event_start_reminder_notifications.apply_async(
                args=(event.id,),
                eta=reminder_eta,
            )

        interested_participants = EventParticipant.objects.filter(
            event=event,
            status=ParticipationStatus.INTERESTED,
        ).select_related("user")

        for participant in interested_participants:
            NotificationService.create_event_planned_notification(
                event=event,
                creator=event.creator,
                recipient=participant.user,
            )

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

    @staticmethod
    @transaction.atomic
    def delete_event(*, event):
        participants = (
            EventParticipant.objects
            .filter(
                event=event,
                status__in=(
                    ParticipationStatus.JOINED,
                    ParticipationStatus.INTERESTED,
                )
            )
            .select_related("user")
            .exclude(user=event.creator)
        )

        for participant in participants:
            NotificationService.create_event_cancelled_notification(
                event=event,
                recipient=participant.user,
                creator=event.creator,
            )

        event.delete()

    @staticmethod
    def can_view(user, event) -> bool:
        if event.creator_id == user.id:
            return True

        if event.event_visibility == EventVisibility.FRIENDS:
            return Friendship.objects.filter(
                status=FriendshipStatus.ACCEPTED,
            ).filter(
                Q(sender=user, receiver=event.creator) |
                Q(sender=event.creator, receiver=user)
            ).exists()

        if event.event_visibility == EventVisibility.FRIENDS_OF_FRIENDS:
            return FriendshipService.get_mutual_friends(
                user1=user,
                user2=event.creator,
            ).exists()

        return False
