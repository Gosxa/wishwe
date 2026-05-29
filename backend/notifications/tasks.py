from celery import shared_task

from event.models import EventParticipant, Event, ParticipationStatus
from notifications.services.notification_service import NotificationService


@shared_task
def send_event_start_reminder_notifications(event_id):
    try:
        event = Event.objects.select_related("creator").get(id=event_id)
    except Event.DoesNotExist:
        return

    interested_participants = (
        EventParticipant.objects
        .filter(
            event=event,
            status=ParticipationStatus.INTERESTED,
        )
        .select_related("user")
        .exclude(user=event.creator)
    )

    for participant in interested_participants:
        NotificationService.create_event_start_reminder_notification(
            recipient=participant.user,
            creator=event.creator,
            event=event,
        )
