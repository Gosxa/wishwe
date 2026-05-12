from django.db import transaction
from django.db.models import Q

from event.models import (
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    ParticipationStatus,
)
from user.models import FriendshipStatus, Friendship


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
