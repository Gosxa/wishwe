from django.contrib import admin
from django.contrib import messages
from .models import Event, Category, EventParticipant
from user.services.moderation_service import ModerationService


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "event_type",
        "status",
        "creator",
        "category",
        "event_date",
        "participants_count",
        "interested_count",
        "created_at",
    )

    list_filter = (
        "event_type",
        "status",
        "event_visibility",
        "category",
        "event_date",
    )

    search_fields = (
        "title",
        "description",
        "location",
        "creator__email",
        "creator__profile__username",
    )

    autocomplete_fields = (
        "creator",
        "category",
    )

    list_select_related = (
        "creator",
        "category",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "participants_count",
        "interested_count",
        "created_at",
        "updated_at",
    )

    date_hierarchy = "created_at"
    actions = ("approve_moderated_events", "reject_moderated_events")

    @staticmethod
    def _events_ready_for_text_review(queryset):
        unresolved_image_statuses = (
            "queued",
            "review",
            "failed",
        )
        return queryset.filter(status="moderate").exclude(
            image_moderations__status__in=unresolved_image_statuses,
        ).distinct()

    @admin.action(description="Approve selected events pending moderation")
    def approve_moderated_events(self, request, queryset):
        ready_events = self._events_ready_for_text_review(queryset)
        for event in ready_events:
            ModerationService.resolve_event(event, approved=True)
        skipped = queryset.filter(status="moderate").count() - ready_events.count()
        if skipped:
            self.message_user(
                request,
                f"{skipped} event(s) have an unresolved image check. "
                "Review them in User → Image moderations first.",
                messages.WARNING,
            )

    @admin.action(description="Reject selected events pending moderation")
    def reject_moderated_events(self, request, queryset):
        ready_events = self._events_ready_for_text_review(queryset)
        for event in ready_events:
            ModerationService.resolve_event(event, approved=False)
        skipped = queryset.filter(status="moderate").count() - ready_events.count()
        if skipped:
            self.message_user(
                request,
                f"{skipped} event(s) have an unresolved image check. "
                "Review them in User → Image moderations first.",
                messages.WARNING,
            )

    fieldsets = (
        (
            "General",
            {
                "fields": (
                    "creator",
                    "category",
                    "event_type",
                    "event_visibility",
                    "status",
                )
            },
        ),
        (
            "Content",
            {
                "fields": (
                    "title",
                    "description",
                    "cover_image",
                    "location",
                    "external_link",
                )
            },
        ),
        (
            "Schedule",
            {
                "fields": (
                    "event_date",
                    "event_time",
                    "timeframe_text",
                    "expires_at",
                )
            },
        ),
        (
            "Participants",
            {
                "fields": (
                    "min_participants",
                    "max_participants",
                    "participants_count",
                    "interested_count",
                )
            },
        ),
        (
            "System",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
    )
    search_fields = (
        "name",
    )
    ordering = (
        "name",
    )


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = (
        "event",
        "user",
        "status",
        "joined_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "event__title",
        "user__email",
        "user__profile__username",
    )

    autocomplete_fields = (
        "event",
        "user",
    )

    list_select_related = (
        "event",
        "user",
    )

    ordering = (
        "-joined_at",
    )

    readonly_fields = (
        "joined_at",
    )

    date_hierarchy = "joined_at"
