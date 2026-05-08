import datetime
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from user.models import FriendInvite
from user.services.friendship_service import FriendshipService


class InviteService:

    @staticmethod
    def create_invite(user):
        return FriendInvite.objects.create(
            inviter=user,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )

    @staticmethod
    def use_invite(token, new_user):
        try:
            invite = FriendInvite.objects.get(token=token)
        except FriendInvite.DoesNotExist:
            raise ValidationError("Invalid invite link")

        if invite.is_used:
            raise ValidationError("Invite already used")

        if invite.expires_at and invite.expires_at < timezone.now():
            raise ValidationError("Invite expired")

        FriendshipService.send_request(
            sender=new_user,
            receiver=invite.inviter
        )

        invite.is_used = True
        invite.save()

        return invite
