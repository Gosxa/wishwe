from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models.signals import post_save

from notifications.models import Notification
from notifications.serializers import NotificationSerializer


def publish_notification(sender, instance, created, **kwargs):
    if not created:
        return

    recipient_id = instance.recipient_id
    payload = NotificationSerializer(instance).data

    def send_notification():
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            f"notifications_user_{recipient_id}",
            {
                "type": "notification.created",
                "notification": payload,
            },
        )

    transaction.on_commit(send_notification)

post_save.connect(
    publish_notification,
    sender=Notification,
    dispatch_uid="notifications.publish_created",
)
