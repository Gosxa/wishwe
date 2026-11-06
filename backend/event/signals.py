from django.db import transaction
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from event.models import Event, EventParticipant
from event.realtime import publish_feed_changed


def schedule_feed_changed(sender, instance, raw=False, **kwargs):
    if raw:
        return

    transaction.on_commit(publish_feed_changed, robust=True)


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


post_save.connect(
    schedule_feed_changed,
    sender=Event,
    dispatch_uid="event.feed_changed_on_save",
)
post_delete.connect(
    schedule_feed_changed,
    sender=Event,
    dispatch_uid="event.feed_changed_on_delete",
)
post_save.connect(
    schedule_feed_changed,
    sender=EventParticipant,
    dispatch_uid="event.feed_changed_on_participant_save",
)
post_delete.connect(
    schedule_feed_changed,
    sender=EventParticipant,
    dispatch_uid="event.feed_changed_on_participant_delete",
)
