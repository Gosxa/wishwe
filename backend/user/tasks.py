from datetime import timedelta

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


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def send_friend_request_accepted_followup_email(self) -> None:
    now = timezone.now()

    friendships = Friendship.objects.select_related(
        "sender__profile",
        "receiver__profile",
    ).filter(
        status=FriendshipStatus.ACCEPTED,
        accepted_at__lte=now - timedelta(days=1),
        followup_email_sent_at__isnull=True,
    )

    for friendship in friendships:
        for recipient, friend in (
            (friendship.sender, friendship.receiver),
            (friendship.receiver, friendship.sender),
        ):
            context = {
                "name": friend.profile.username,
                "friend_profile_url": (
                    f"{settings.FRONTEND_URL}/user/{friend.profile.username}"
                ),
            }

            html_content = render_to_string(
                "emails/friend_request_accepted_followup.html",
                context,
            )

            email = EmailMultiAlternatives(
                subject="Plan something with your new friend!",
                body="",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient.email],
            )

            email.attach_alternative(html_content, "text/html")
            email.send()

        friendship.followup_email_sent_at = now
        friendship.save(update_fields=["followup_email_sent_at"])
