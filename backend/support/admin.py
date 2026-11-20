from django.contrib import admin

from support.models import SupportRequest


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "category",
        "email",
        "delivery_status",
    )
    list_filter = ("category", "delivery_status", "created_at")
    search_fields = ("email", "display_name", "message", "=id")
    readonly_fields = ("id", "created_at", "email_sent_at")
