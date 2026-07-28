from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    City,
    EmailVerification,
    FriendInvite,
    Friendship,
    Profile,
    SocialAccount,
    User,
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
        "is_onboarded",
        "updated_at",
    )
    list_filter = (
        "gender",
        "is_private",
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
