from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

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


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_interested_event_email(event_id: str, actor_id: str):
    event = Event.objects.select_related("creator").get(id=event_id)
    actor = get_user_model().objects.get(id=actor_id)

    context = {
        "name": actor.username,
        "wish_name": event.title,
        "wish_url": f"{settings.FRONTEND_URL}/feed?event={event.id}",
    }

    html = render_to_string(
        "emails/interested_event.html",
        context,
    )

    message = EmailMultiAlternatives(
        subject=f"{actor.username} is interested in your Wish",
        body="",
        from_email=settings.EMAIL_HOST_USER,
        to=[event.creator.email],
    )
    message.attach_alternative(html, "text/html")
    message.send()


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_joined_event_email(event_id: str, actor_id: str) -> None:
    event = Event.objects.select_related("creator").get(id=event_id)
    actor = get_user_model().objects.get(id=actor_id)

    context = {
        "name": actor.username,
        "plan_name": event.title,
        "plan_url": f"{settings.FRONTEND_URL}/feed?event={event.id}",
    }

    html_message = render_to_string(
        "emails/joined_event.html",
        context,
    )

    message = EmailMultiAlternatives(
        subject=f"{actor.username} joined your Plan",
        body="",
        from_email=settings.EMAIL_HOST_USER,
        to=[event.creator.email],
    )
    message.attach_alternative(html_message, "text/html")
    message.send()


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_event_confirm_reminder_email(event_id: str) -> None:
    event = (
        Event.objects
        .select_related("creator")
        .prefetch_related("participants__user")
        .get(id=event_id)
    )

    interested_participants = (
        event.participants
        .filter(status=ParticipationStatus.INTERESTED)
        .select_related("user")
    )

    for participant in interested_participants:
        context = {
            "name": participant.user.username,
            "plan_name": event.title,
            "plan_url": f"{settings.FRONTEND_URL}/feed?event={event.id}",
        }

        html_message = render_to_string(
            "emails/event_confirm_reminder.html",
            context,
        )

        message = EmailMultiAlternatives(
            subject=f'"{event.title}" has been confirmed!',
            body="",
            from_email=settings.EMAIL_HOST_USER,
            to=[participant.user.email],
        )
        message.attach_alternative(html_message, "text/html")
        message.send()
