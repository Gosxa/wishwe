from celery import shared_task
from django.utils import timezone

from event.models import Event, EventStatus
from event.realtime import publish_feed_changed


@shared_task
def complete_expired_events():
    expired_events = Event.objects.filter(
        expires_at__lte=timezone.now(),
        status__in=[
            EventStatus.ACTIVE,
            EventStatus.CLOSED,
        ]
    )

    updated_count = expired_events.update(
        status=EventStatus.COMPLETED
    )

    if updated_count:
        publish_feed_changed()
