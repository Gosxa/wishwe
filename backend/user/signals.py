from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .models import ImageModeration, Profile


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


@receiver(post_delete, sender=ImageModeration)
def delete_staged_moderation_image(sender, instance, **kwargs):
    if instance.image:
        instance.image.delete(save=False)
