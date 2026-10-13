from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import transaction
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    City,
    EmailVerification,
    FriendInvite,
    Friendship,
    ImageModeration,
    Profile,
    ModerationViolation,
    SocialAccount,
    User,
)
from user.services.image_moderation_service import (
    resolve_image_moderation,
    retry_image_moderation,
)


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,)

    list_display = (
        "email",
        "username",
        "is_verified",
        "is_staff",
        "is_active",
    )
    list_filter = (
        "is_verified",
        "is_staff",
        "is_active",
        "is_superuser",
    )
    search_fields = (
        "email",
        "profile__username",
    )
    ordering = ("email",)
    list_select_related = ("profile",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Status", {"fields": ("is_verified",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    @admin.display(description="Username")
    def username(self, obj):
        return getattr(obj.profile, "username", "-")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "user",
        "city",
        "gender",
        "is_private",
        "violation_count",
        "is_banned",
        "last_violation_at",
        "is_onboarded",
        "updated_at",
    )
    list_filter = (
        "gender",
        "is_private",
        "violation_count",
        "is_onboarded",
        "city",
    )
    search_fields = (
        "username",
        "first_name",
        "last_name",
        "user__email",
    )
    ordering = ("username",)
    autocomplete_fields = (
        "user",
        "city",
    )
    list_select_related = (
        "user",
        "city",
    )
    readonly_fields = ("updated_at",)

    @admin.display(boolean=True, description="Banned")
    def is_banned(self, obj):
        return obj.is_banned


@admin.register(ModerationViolation)
class ModerationViolationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "field_name",
        "categories",
        "status",
        "strike_applied",
        "occurred_at",
        "resolved_at",
    )
    list_filter = ("status", "occurred_at")
    search_fields = (
        "user__email",
        "user__profile__username",
        "field_name",
        "content_excerpt",
    )
    list_select_related = ("user", "event")
    actions = ("overturn_violations",)
    readonly_fields = (
        "user",
        "event",
        "event_uuid",
        "field_name",
        "categories",
        "matched_terms",
        "content_excerpt",
        "status",
        "strike_applied",
        "occurred_at",
        "resolved_at",
    )

    @admin.action(description="Overturn selected confirmed violations")
    @transaction.atomic
    def overturn_violations(self, request, queryset):
        now = timezone.now()
        selected = list(queryset.filter(
            status=ModerationViolation.Status.CONFIRMED,
        ))
        by_user = {}
        for violation in selected:
            violation.status = ModerationViolation.Status.OVERTURNED
            violation.resolved_at = now
            violation.save(update_fields=("status", "resolved_at"))
            by_user[violation.user_id] = violation.user

        for user in by_user.values():
            profile = Profile.objects.get(user=user)
            overturned_count = sum(
                item.user_id == user.id for item in selected
            )
            profile.violation_count = max(
                0,
                profile.violation_count - overturned_count,
            )
            remaining = ModerationViolation.objects.filter(
                user=user,
                status__in=(
                    ModerationViolation.Status.CONFIRMED,
                    ModerationViolation.Status.PENDING,
                ),
            ).order_by("-occurred_at").first()
            profile.last_violation_at = remaining.occurred_at if remaining else None
            profile.save(update_fields=("violation_count", "last_violation_at", "updated_at"))


@admin.register(ImageModeration)
class ImageModerationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "target",
        "event",
        "status",
        "category_summary",
        "created_at",
        "resolved_at",
    )
    list_filter = ("status", "target", "created_at")
    search_fields = (
        "user__email",
        "user__profile__username",
        "event__title",
        "ocr_text",
    )
    list_select_related = ("user", "event", "violation")
    readonly_fields = (
        "user",
        "event",
        "target",
        "image_preview",
        "status",
        "provider",
        "model_name",
        "ocr_text",
        "categories",
        "category_scores",
        "violation",
        "error_message",
        "created_at",
        "resolved_at",
    )
    fields = readonly_fields
    actions = (
        "approve_images",
        "reject_images",
        "retry_failed_checks",
    )

    @admin.display(description="Image")
    def image_preview(self, obj):
        if not obj.image:
            return "No staged image"
        return format_html(
            '<img src="{}" style="max-width: 320px; max-height: 240px;" />',
            obj.image.url,
        )

    @admin.display(description="Detected categories")
    def category_summary(self, obj):
        return ", ".join(
            name for name, flagged in obj.categories.items() if flagged
        ) or "—"

    @admin.action(description="Approve selected images")
    def approve_images(self, request, queryset):
        resolved = 0
        for item in queryset.filter(status=ImageModeration.Status.REVIEW):
            resolve_image_moderation(item.pk, approved=True)
            resolved += 1
        self.message_user(
            request,
            f"Approved {resolved} image moderation item(s).",
            messages.SUCCESS,
        )

    @admin.action(description="Reject selected images and apply a strike")
    def reject_images(self, request, queryset):
        resolved = 0
        for item in queryset.filter(status=ImageModeration.Status.REVIEW):
            resolve_image_moderation(item.pk, approved=False)
            resolved += 1
        self.message_user(
            request,
            f"Rejected {resolved} image moderation item(s).",
            messages.SUCCESS,
        )

    @admin.action(description="Retry failed image checks")
    def retry_failed_checks(self, request, queryset):
        retried = sum(
            retry_image_moderation(item.pk)
            for item in queryset.filter(status=ImageModeration.Status.FAILED)
        )
        self.message_user(
            request,
            f"Queued {retried} image moderation check(s) for retry.",
            messages.SUCCESS,
        )


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "country",
    )
    search_fields = (
        "name",
        "country",
    )
    ordering = (
        "country",
        "name",
    )


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "provider",
        "uid",
    )
    list_filter = ("provider",)
    search_fields = (
        "user__email",
        "uid",
    )
    autocomplete_fields = ("user",)
    list_select_related = ("user",)


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "purpose",
        "is_verified",
        "attempts",
        "expires_at",
        "created_at",
    )
    list_filter = (
        "purpose",
        "is_verified",
    )
    search_fields = ("email",)
    ordering = ("-created_at",)
    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = (
        "sender",
        "receiver",
        "status",
        "created_at",
        "accepted_at",
        "followup_email_sent_at",
    )
    list_filter = ("status",)
    search_fields = (
        "sender__email",
        "receiver__email",
        "sender__profile__username",
        "receiver__profile__username",
    )
    autocomplete_fields = (
        "sender",
        "receiver",
    )
    list_select_related = (
        "sender",
        "receiver",
    )
    ordering = ("-created_at",)
    readonly_fields = (
        "created_at",
        "accepted_at",
        "followup_email_sent_at",
    )
    date_hierarchy = "created_at"


@admin.register(FriendInvite)
class FriendInviteAdmin(admin.ModelAdmin):
    list_display = (
        "inviter",
        "created_at",
        "expires_at",
    )
    search_fields = (
        "inviter__email",
    )
    autocomplete_fields = ("inviter",)
    list_select_related = ("inviter",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
