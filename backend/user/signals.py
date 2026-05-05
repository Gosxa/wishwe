from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Profile


@receiver(pre_save, sender=Profile)
def delete_old_avatar(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old = Profile.objects.get(pk=instance.pk)
    except Profile.DoesNotExist:
        return

    if old.avatar and old.avatar != instance.avatar:
        old.avatar.delete(save=False)
