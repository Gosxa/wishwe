from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from user.models import FriendInvite, Friendship, FriendshipStatus


@shared_task
def delete_expired_invites():
    FriendInvite.objects.filter(
        expires_at__lt=timezone.now()
    ).delete()


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_friend_request_reminder_email(self, friendship_id: int) -> None:
    try:
        friendship = Friendship.objects.select_related(
            "sender",
            "receiver",
        ).get(id=friendship_id)
    except Friendship.DoesNotExist:
        return

    if friendship.status != FriendshipStatus.PENDING:
        return

    receiver = friendship.receiver

    context = {
        "name": receiver.profile.username,
        "sender_name": friendship.sender.profile.username,
        "friends_url": f"{settings.FRONTEND_URL}/friends",
    }

    html_content = render_to_string(
        "emails/friend_request.html",
        context,
    )

    email = EmailMultiAlternatives(
        subject="You have a pending friend request",
        body="",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[receiver.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send()
