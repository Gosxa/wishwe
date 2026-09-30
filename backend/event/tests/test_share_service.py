import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase

from event.models import Event, EventType
from event.services.share_service import EventShareService


class EventShareServiceTests(TestCase):
    def setUp(self):
        self.creator = get_user_model().objects.create_user(
            email="creator@test.com",
            password="testpass123",
        )
        self.event = Event.objects.create(
            creator=self.creator,
            event_type=EventType.WISH,
            title="A shareable wish",
            description="Description",
            location="Budapest",
            timeframe_text="Someday",
        )

    def test_create_share_link_is_stable_when_repeated(self):
        EventShareService.create_share_link(self.event)
        first_token = self.event.share_token

        EventShareService.create_share_link(self.event)

        self.event.refresh_from_db()
        self.assertEqual(self.event.share_token, first_token)

    def test_regenerate_share_link_invalidates_previous_token(self):
        EventShareService.create_share_link(self.event)
        previous_token = self.event.share_token

        EventShareService.regenerate_share_link(self.event)

        self.assertNotEqual(self.event.share_token, previous_token)
        self.assertIsNone(EventShareService.get_shared_event(previous_token))
        self.assertEqual(
            EventShareService.get_shared_event(self.event.share_token),
            self.event,
        )

    def test_revoke_share_link_removes_lookup(self):
        EventShareService.create_share_link(self.event)
        token = self.event.share_token

        EventShareService.revoke_share_link(self.event)

        self.event.refresh_from_db()
        self.assertIsNone(self.event.share_token)
        self.assertIsNone(EventShareService.get_shared_event(token))

    def test_unknown_token_returns_none(self):
        self.assertIsNone(EventShareService.get_shared_event(uuid.uuid4()))
