from django.core.management.base import BaseCommand
from django.db import transaction

from event.models import Event, EventStatus
from user.models import ModerationViolation
from event.services.event_service import EventService
from user.services.moderation_service import ModerationService


class Command(BaseCommand):
    help = (
        "Find active events matching the moderation lexicon and queue them "
        "for admin review without immediately adding strikes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Hide matching active events and create moderation records.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Inspect at most this many eligible events.",
        )

    def handle(self, *args, **options):
        queryset = Event.objects.filter(
            status=EventStatus.ACTIVE,
        ).exclude(
            moderation_violations__isnull=False,
        ).order_by("id")
        if options["limit"]:
            queryset = queryset[:options["limit"]]

        checked = 0
        matched = 0
        queued = 0

        for event in queryset.iterator(chunk_size=500):
            checked += 1
            matches = EventService._moderation_matches({}, event)
            if not matches:
                continue

            matched += 1
            if not options["apply"]:
                self.stdout.write(
                    f"Would queue event {event.id} for review "
                    f"(creator {event.creator_id}; "
                    f"fields: {', '.join(sorted({m['field'] for m in matches}))})"
                )
                continue

            with transaction.atomic():
                locked_event = Event.objects.select_for_update().get(pk=event.pk)
                if locked_event.status != EventStatus.ACTIVE:
                    continue
                if ModerationViolation.objects.filter(
                    event=locked_event,
                ).exists():
                    continue

                matches = EventService._moderation_matches({}, locked_event)
                if not matches:
                    continue

                ModerationService.record_violation(
                    user=locked_event.creator,
                    matches=matches,
                    event=locked_event,
                    pending=True,
                    apply_strike=False,
                )
                locked_event.status = EventStatus.MODERATE
                locked_event.save(update_fields=("status", "updated_at"))
                queued += 1

        mode = "Applied" if options["apply"] else "Preview"
        self.stdout.write(
            self.style.SUCCESS(
                f"{mode}: checked {checked}, matched {matched}, "
                f"queued {queued}."
            )
        )
