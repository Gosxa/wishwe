from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver

from event.models import Event


@receiver(pre_save, sender=Event)
def delete_old_cover_image(
    sender,
    instance,
    **kwargs,
):
    if not instance.pk:
        return

    try:
        old_event = Event.objects.get(
            pk=instance.pk
        )

    except Event.DoesNotExist:
        return

    if (
        old_event.cover_image
        and old_event.cover_image != instance.cover_image
    ):
        old_event.cover_image.delete(
            save=False
        )


@receiver(post_delete, sender=Event)
def delete_cover_image_on_event_delete(
    sender,
    instance,
    **kwargs,
):
    if instance.cover_image:
        instance.cover_image.delete(
            save=False
        )
