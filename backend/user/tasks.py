from celery import shared_task
from django.utils import timezone

from user.models import FriendInvite


@shared_task
def delete_expired_invites():
    FriendInvite.objects.filter(
        expires_at__lt=timezone.now()
    ).delete()
