from notifications.models import (
    Notification,
    NotificationType,
    RelatedObjectType,
)


class NotificationService:
    @staticmethod
    def create_friend_request_notification(
        *,
        friendship,
    ):
        return Notification.objects.create(
            recipient=friendship.receiver,
            creator=friendship.sender,
            type=NotificationType.FRIEND_REQUEST,
            title="New friend request",
            message=(
                f"👋 {friendship.sender.profile.username} wants to connect. "
                f"Accept to see their Wishes and start planning your next hangouts!"
            ),
            related_object_type=RelatedObjectType.FRIENDSHIP,
            related_object_id=friendship.id,
        )

    @staticmethod
    def create_friend_request_accepted_notification(
        *,
        friendship,
    ):
        return Notification.objects.create(
            recipient=friendship.sender,
            creator=friendship.receiver,
            type=NotificationType.FRIEND_REQUEST_ACCEPTED,
            title="Friend request accepted",
            message=(
                f"🤝You and {friendship.receiver.profile.username} are now "
                f"friends! Time to check out what they're up to."
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
            title="New plan participant",
            message=(
                f"🔥 {user.profile.username} just "
                f"joined '{event.title}'. See you there!"
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
            title="User interested in your wish",
            message=(
                f"👀 {user.profile.username} is also down for '{event.title}'."
                f" Time to turn this Wish into a real plan?"
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
                f"✍️ The details for '{event.title}' just got updated."
                f" Take a quick look to stay in the loop."
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
                f"😔 '{event.title}' is off. It happens! Perfect excuse "
                f"to drop a new Wish for this weekend, though."
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
                f"🚀 {creator.profile.username} made '{event.title}' official."
                f" You liked this Wish — now it's time to hit 'Join'!"
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
                f"⏰ Don't forget about '{event.title}' tomorrow! "
                f"Check the plan for the exact time and location."
            ),
            related_object_type=RelatedObjectType.EVENT,
            related_object_id=event.id,
        )
