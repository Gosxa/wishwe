import uuid

from django.db import transaction

from event.models import Event


class EventShareService:
    @classmethod
    @transaction.atomic
    def create_share_link(cls, event: Event) -> Event:
        """
        Creates a share link for the event.

        If a share link already exists, returns the event unchanged.
        """

        if event.share_token:
            return event

        event.share_token = uuid.uuid4()
        event.save(update_fields=["share_token"])

        return event

    @classmethod
    @transaction.atomic
    def regenerate_share_link(cls, event: Event) -> Event:
        """
        Generates a new share link.
        The previous link becomes invalid immediately.
        """

        event.share_token = uuid.uuid4()
        event.save(update_fields=["share_token"])

        return event

    @classmethod
    @transaction.atomic
    def revoke_share_link(cls, event: Event) -> Event:
        """
        Revokes the current share link.
        """

        event.share_token = None
        event.save(update_fields=["share_token"])

        return event

    @staticmethod
    def get_shared_event(token: uuid.UUID) -> Event | None:
        """
        Returns an event by share token.
        Returns None if the token does not exist.
        """

        return (
            Event.objects
            .select_related("creator")
            .filter(share_token=token)
            .first()
        )
