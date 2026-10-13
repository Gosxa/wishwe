from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, SimpleTestCase
from django.utils import timezone

from event.models import Event, EventStatus, EventType
from event.services.event_service import EventService
from user.models import ModerationViolation, Profile
from user.serializers import ProfileSerializer
from user.services.moderation_service import (
    ModerationService,
    find_ban_word_matches,
)


User = get_user_model()


class BanWordMatcherTests(SimpleTestCase):
    def test_matches_configured_variants_and_plural_forms(self):
        for value in ("nigga", "niggas", "nigger", "niggers"):
            with self.subTest(value=value):
                matches = find_ban_word_matches({"title": value})
                self.assertTrue(matches)
                self.assertEqual(
                    {match["category"] for match in matches},
                    {"hate_and_discrimination"},
                )

    def test_matches_inflected_phrase_without_matching_inside_words(self):
        matches = find_ban_word_matches({"title": "Drug dealers wanted"})
        self.assertTrue(matches)
        self.assertEqual(matches[0]["category"], "drugs")

        self.assertEqual(
            find_ban_word_matches({"title": "niggerish is not a word match"}),
            [],
        )

    def test_matches_fields_individually(self):
        matches = find_ban_word_matches({
            "title": "Board games",
            "description": "Buy cocaine",
        })

        self.assertEqual({match["field"] for match in matches}, {"description"})


class ModerationFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="moderation@test.com",
            password="testpass123",
        )
        self.profile = Profile.objects.create(
            user=self.user,
            username="moderation-user",
        )

    def make_event(self, *, title, status=EventStatus.ACTIVE):
        return Event.objects.create(
            creator=self.user,
            event_type=EventType.WISH,
            title=title,
            description="A test event",
            location="Kyiv",
            timeframe_text="Next weekend",
            status=status,
        )

    def test_flagged_event_creation_is_queued_and_counts_a_strike(self):
        event = EventService.create_wish(
            creator=self.user,
            validated_data={
                "title": "Sell cocaine",
                "description": "A test event",
                "location": "Kyiv",
                "timeframe_text": "Next weekend",
            },
        )

        self.profile.refresh_from_db()
        violation = ModerationViolation.objects.get(event=event)
        self.assertEqual(event.status, EventStatus.MODERATE)
        self.assertEqual(self.profile.violation_count, 1)
        self.assertEqual(violation.status, ModerationViolation.Status.PENDING)
        self.assertTrue(violation.strike_applied)

    def test_profile_text_violation_is_rejected_and_recorded(self):
        serializer = ProfileSerializer(
            self.profile,
            data={"bio": "Stupid bitch"},
            partial=True,
        )

        self.assertFalse(serializer.is_valid())
        self.profile.refresh_from_db()
        violation = ModerationViolation.objects.get(user=self.user)
        self.assertEqual(self.profile.violation_count, 1)
        self.assertEqual(violation.field_name, "bio")
        self.assertEqual(violation.status, ModerationViolation.Status.CONFIRMED)

    def test_approving_historical_event_does_not_apply_a_strike(self):
        event = self.make_event(title="Buy cocaine", status=EventStatus.MODERATE)
        matches = EventService._moderation_matches({}, event)
        violation = ModerationService.record_violation(
            user=self.user,
            matches=matches,
            event=event,
            pending=True,
            apply_strike=False,
        )

        ModerationService.resolve_event(event, approved=True)

        event.refresh_from_db()
        violation.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertEqual(violation.status, ModerationViolation.Status.OVERTURNED)
        self.assertFalse(violation.strike_applied)
        self.assertEqual(self.profile.violation_count, 0)

    def test_rejecting_historical_event_applies_one_strike(self):
        event = self.make_event(title="Buy cocaine", status=EventStatus.MODERATE)
        violation = ModerationService.record_violation(
            user=self.user,
            matches=EventService._moderation_matches({}, event),
            event=event,
            pending=True,
            apply_strike=False,
        )

        ModerationService.resolve_event(event, approved=False)

        violation.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertFalse(Event.objects.filter(pk=event.pk).exists())
        self.assertEqual(violation.status, ModerationViolation.Status.CONFIRMED)
        self.assertTrue(violation.strike_applied)
        self.assertEqual(self.profile.violation_count, 1)

    def test_expiry_ignores_pending_review_without_a_strike(self):
        self.profile.violation_count = 1
        self.profile.last_violation_at = timezone.now() - timedelta(days=31)
        self.profile.save(update_fields=(
            "violation_count",
            "last_violation_at",
        ))
        confirmed = ModerationViolation.objects.create(
            user=self.user,
            field_name="bio",
            categories=["harassment"],
            matched_terms=["test"],
            status=ModerationViolation.Status.CONFIRMED,
            strike_applied=True,
        )
        event = self.make_event(title="Buy cocaine", status=EventStatus.MODERATE)
        pending = ModerationService.record_violation(
            user=self.user,
            matches=EventService._moderation_matches({}, event),
            event=event,
            pending=True,
            apply_strike=False,
        )

        expired_count = ModerationService.expire_monthly_violations()

        self.profile.refresh_from_db()
        confirmed.refresh_from_db()
        pending.refresh_from_db()
        self.assertEqual(expired_count, 1)
        self.assertEqual(self.profile.violation_count, 0)
        self.assertIsNone(self.profile.last_violation_at)
        self.assertEqual(confirmed.status, ModerationViolation.Status.EXPIRED)
        self.assertEqual(pending.status, ModerationViolation.Status.PENDING)

    def test_historical_recheck_command_is_dry_run_then_idempotent(self):
        event = self.make_event(title="Buy cocaine")
        output = StringIO()

        call_command("recheck_existing_events", stdout=output)

        event.refresh_from_db()
        self.assertEqual(event.status, EventStatus.ACTIVE)
        self.assertFalse(ModerationViolation.objects.filter(event=event).exists())

        call_command("recheck_existing_events", "--apply", stdout=StringIO())
        event.refresh_from_db()
        violation = ModerationViolation.objects.get(event=event)
        self.assertEqual(event.status, EventStatus.MODERATE)
        self.assertFalse(violation.strike_applied)
        self.assertEqual(self.profile.violation_count, 0)

        call_command("recheck_existing_events", "--apply", stdout=StringIO())
        self.assertEqual(
            ModerationViolation.objects.filter(event=event).count(),
            1,
        )
