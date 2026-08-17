import datetime
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from event.models import (
    Category,
    Event,
    EventStatus,
    EventType,
    EventVisibility,
)
from user.models import Profile


User = get_user_model()


class Command(BaseCommand):
    help = "Create the minimal deterministic data used by Playwright E2E tests."

    def handle(self, *args, **options):
        if not getattr(settings, "IS_E2E", False):
            raise CommandError("seed_e2e is restricted to the E2E settings module")

        email = os.getenv("WISHWE_E2E_EMAIL", "owner.e2e@wishwe.test")
        password = os.getenv("WISHWE_E2E_PASSWORD", "PlaywrightPass123!")
        event_title = os.getenv(
            "WISHWE_E2E_EVENT_TITLE",
            "E2E Share Flow Plan",
        )

        with transaction.atomic():
            User.objects.filter(email=email).delete()

            user = User.objects.create_user(
                email=email,
                password=password,
                is_active=True,
                is_verified=True,
            )
            Profile.objects.create(
                user=user,
                username="e2e_share_owner",
                first_name="E2E",
                last_name="Owner",
                is_onboarded=True,
                has_seen_feed_tour=True,
            )

            category, _ = Category.objects.get_or_create(name="E2E Testing")
            event_date = timezone.localdate() + datetime.timedelta(days=30)
            event_time = datetime.time(hour=19, minute=30)

            Event.objects.create(
                creator=user,
                category=category,
                event_type=EventType.PLAN,
                event_visibility=EventVisibility.FRIENDS_OF_FRIENDS,
                title=event_title,
                description=(
                    "A deterministic private plan used to verify the complete "
                    "Share Event journey."
                ),
                location="Playwright Test Venue",
                event_date=event_date,
                event_time=event_time,
                min_participants=1,
                max_participants=8,
                participants_count=0,
                status=EventStatus.ACTIVE,
                expires_at=timezone.make_aware(
                    datetime.datetime.combine(event_date, event_time)
                ),
                share_token=None,
            )

        self.stdout.write(self.style.SUCCESS("Playwright E2E data is ready."))
