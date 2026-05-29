from django.contrib.auth import get_user_model
from django.db.models import Q, Case, When, F, Subquery
from rest_framework.exceptions import PermissionDenied, ValidationError
from notifications.services.notification_service import NotificationService
from user.models import Friendship, FriendshipStatus


class FriendshipService:

    @staticmethod
    def send_request(sender, receiver):
        if sender == receiver:
            raise ValidationError("Cannot add yourself")

        existing = Friendship.objects.filter(
            Q(sender=sender, receiver=receiver) |
            Q(sender=receiver, receiver=sender)
        ).select_for_update().first()

        if existing:
            if existing.status == FriendshipStatus.ACCEPTED:
                raise ValidationError("Already friends")
            if existing.status == FriendshipStatus.PENDING:
                raise ValidationError("Friendship request already exists")

            existing.status = FriendshipStatus.PENDING
            existing.sender = sender
            existing.receiver = receiver
            existing.save()
            return existing


        friendship = Friendship.objects.create(
            sender=sender,
            receiver=receiver,
            status=FriendshipStatus.PENDING
        )

        NotificationService.create_friend_request_notification(
            friendship=friendship
        )

        return friendship

    @staticmethod
    def accept_request(friendship: Friendship, user):
        if friendship.receiver != user:
            raise PermissionDenied()
        if friendship.status != FriendshipStatus.PENDING:
            raise ValidationError("Request is not pending")
        friendship.status = FriendshipStatus.ACCEPTED
        friendship.save()

        NotificationService.create_friend_request_accepted_notification(
            friendship=friendship
        )

    @staticmethod
    def decline_request(friendship: Friendship, user):
        if friendship.receiver != user:
            raise PermissionDenied()
        if friendship.status != FriendshipStatus.PENDING:
            raise ValidationError("Request is not pending")
        friendship.status = FriendshipStatus.REJECTED
        friendship.save()

    @staticmethod
    def get_friends(user):
        friendships = Friendship.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status=FriendshipStatus.ACCEPTED
        ).select_related("sender__profile", "receiver__profile",)

        result = []

        for f in friendships:
            friend = f.receiver if f.sender == user else f.sender
            result.append({
                "id": friend.id,
                "username": friend.profile.username,
                "friendship_id": f.id
            })

        return result

    @staticmethod
    def get_incoming_requests(user):
        queryset = Friendship.objects.filter(
            receiver=user,
            status=FriendshipStatus.PENDING
        )
        return queryset

    @staticmethod
    def delete_friendship(friendship, user):
        if friendship.sender != user and friendship.receiver != user:
            raise PermissionDenied()

        friendship.delete()

    @staticmethod
    def friends_ids_subquery(user):
        return Friendship.objects.filter(
            Q(sender=user) | Q(receiver=user),
            status=FriendshipStatus.ACCEPTED
        ).annotate(
            friend_id=Case(
                When(sender=user, then=F("receiver_id")),
                default=F("sender_id"),
            )
        ).values("friend_id")

    @staticmethod
    def get_mutual_friends(user1, user2):
        friends1 = FriendshipService.friends_ids_subquery(user1)
        friends2 = FriendshipService.friends_ids_subquery(user2)

        return get_user_model().objects.filter(
            id__in=Subquery(friends1)
        ).filter(
            id__in=Subquery(friends2)
        ).select_related("profile")
