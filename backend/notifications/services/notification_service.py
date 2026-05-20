from notifications.models import (
    Notification,
    NotificationType,
    RelatedObjectType,
)


class NotificationService:
    @staticmethod
    def create_friend_request_notification(
        *,
        sender,
        receiver,
        friendship,
    ):
        return Notification.objects.create(
            recipient=receiver,
            creator=sender,
            type=NotificationType.FRIEND_REQUEST,
            title="New friend request",
            message=(
                f"{sender.profile.username} "
                f"sent you a friend request."
            ),
            related_object_type=RelatedObjectType.FRIENDSHIP,
            related_object_id=friendship.id,
        )

    @staticmethod
    def create_friend_request_accepted_notification(
        *,
        sender,
        receiver,
        friendship,
    ):
        return Notification.objects.create(
            recipient=sender,
            creator=receiver,
            type=NotificationType.FRIEND_REQUEST_ACCEPTED,
            title="Friend request accepted",
            message=(
                f"{receiver.profile.username} "
                f"accepted your friend request."
            ),
            related_object_type=RelatedObjectType.FRIENDSHIP,
            related_object_id=friendship.id,
        )

    @staticmethod
    def create_joined_event_notification(
        *,
        user,
        event,
    ):
        return Notification.objects.create(
            recipient=event.creator,
            creator=user,
            type=NotificationType.JOINED_EVENT,
            title="New event participant",
            message=(
                f"{user.profile.username} "
                f"joined your plan."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )

    @staticmethod
    def create_interested_event_notification(
        *,
        user,
        event,
    ):
        return Notification.objects.create(
            recipient=event.creator,
            creator=user,
            type=NotificationType.INTERESTED_EVENT,
            title="User interested in your event",
            message=(
                f"{user.profile.username} "
                f"is interested in your wish."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )

    @staticmethod
    def create_event_updated_notification(
        *,
        recipient,
        creator,
        event,
    ):
        return Notification.objects.create(
            recipient=recipient,
            creator=creator,
            type=NotificationType.EVENT_UPDATED,
            title="Event updated",
            message=(
                f'The {event.event_type} "{event.title}" '
                f"has been updated."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )

    @staticmethod
    def create_event_cancelled_notification(
        *,
        recipient,
        creator,
        event,
    ):
        return Notification.objects.create(
            recipient=recipient,
            creator=creator,
            type=NotificationType.EVENT_CANCELLED,
            title="Event cancelled",
            message=(
                f'The event "{event.title}" '
                f"has been cancelled."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )

    @staticmethod
    def create_event_planned_notification(
        *,
        recipient,
        creator,
        event,
    ):
        return Notification.objects.create(
            recipient=recipient,
            creator=creator,
            type=NotificationType.EVENT_PLANNED,
            title="Wish confirmed",
            message=(
                f'The wish "{event.title}" '
                f"is now planned."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )

    @staticmethod
    def create_event_start_reminder_notification(
            *,
            recipient,
            creator,
            event,
    ):
        return Notification.objects.create(
            recipient=recipient,
            creator=creator,
            type=NotificationType.EVENT_START_REMINDER,
            title="Event starts soon",
            message=(
                f'The event "{event.title}" '
                f"starts in 24 hours."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )
