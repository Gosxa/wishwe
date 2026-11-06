import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


logger = logging.getLogger(__name__)

EVENT_FEED_GROUP = "events_feed_all"


def publish_feed_changed():
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    try:
        async_to_sync(channel_layer.group_send)(
            EVENT_FEED_GROUP,
            {"type": "feed_changed"},
        )
    except Exception:
        logger.exception("Could not publish event feed change")
