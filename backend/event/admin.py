from django.contrib import admin
from .models import Event, Category, EventParticipant


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
