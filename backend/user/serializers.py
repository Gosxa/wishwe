from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from common.validators import validate_image_type, validate_image_size
from user.models import Profile, Friendship, FriendInvite, FriendshipStatus
from user.services.moderation_service import (
    ModerationService,
    find_ban_word_matches,
)


PROFILE_TEXT_FIELDS = (
    "username",
    "first_name",
    "last_name",
    "bio",
    "social_media_url",
)


def validate_profile_content(profile, attrs):
    if profile is None:
        return

    if (
        profile.is_banned
        and attrs.get("is_private") is False
    ):
        raise serializers.ValidationError({
            "is_private": "Banned profiles must remain private."
        })

    fields = {
        name: attrs.get(name, getattr(profile, name, None))
        for name in PROFILE_TEXT_FIELDS
    }
    matches = find_ban_word_matches(fields)
    if matches:
        ModerationService.record_violation(
            user=profile.user,
            matches=matches,
        )
        raise serializers.ValidationError(
            "Profile changes were rejected due to a content rule. "
            "A warning has been recorded; contact support from your "
            "account email if you believe this was a mistake."
        )


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class SetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(
        min_length=8,
        write_only=True,
        style={"input_type": "password"}
    )

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError(
                "Password cannot be only digits"
            )
        return value


class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source="user.email", read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    active_events_count = serializers.IntegerField(read_only=True)
    archived_events_count = serializers.IntegerField(read_only=True)
    is_banned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Profile
        fields = (
            "id", "uuid", "user", "user_id", "username", "first_name",
            "last_name",
            "bio", "date_of_birth", "city", "gender", "avatar",
            "social_media_url", "is_private", "has_seen_feed_tour",
            "active_events_count", "archived_events_count",
            "is_banned",
        )
        read_only_fields = ("avatar",)

    def validate(self, attrs):
        validate_profile_content(self.instance, attrs)
        return attrs


class ProfileReadSerializer(ProfileSerializer):
    city = serializers.CharField(source="city.name", read_only=True)


class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("username", "first_name", "last_name")

    def validate(self, attrs):
        validate_profile_content(self.instance, attrs)
        return attrs


class AvatarSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(
        validators=[
            validate_image_size,
            validate_image_type,
        ],
        required=False,
    )
    class Meta:
        model = Profile
        fields = ("avatar",)


class SetNewPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    re_new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["re_new_password"]:
            raise serializers.ValidationError(
                {"re_new_password": "Passwords do not match"}
            )

        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )

    def validate_new_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be only digits")
        return value


class FriendshipSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source="sender.profile.username", read_only=True)
    sender_avatar = serializers.ImageField(source="sender.profile.avatar", read_only=True)
    receiver = serializers.CharField(source="receiver.profile.username", read_only=True)

    class Meta:
        model = Friendship
        fields = ("id", "sender", "sender_avatar", "receiver", "status")


class FriendSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField()
    avatar = serializers.ImageField()
    friendship_id = serializers.IntegerField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "email",
            "is_staff",
            "is_verified"
        )
        read_only_fields = ("id", "email", "is_staff", "is_verified")


class MutualFriendsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="profile.username", read_only=True)

    class Meta:
        model = get_user_model()
        fields = ("id", "username",)


class InviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendInvite
        fields = ("id", "token", "created_at")


class InviteUseSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class EmailStartResponseSerializer(
    serializers.Serializer
):
    flow = serializers.CharField()


class FriendshipRequestSerializer(
    serializers.Serializer
):
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(),
        source="receiver",
    )


class PublicProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    friendship_status = serializers.SerializerMethodField()
    is_banned = serializers.BooleanField(read_only=True)

    class Meta:
        model = Profile
        fields = (
            "uuid",
            "user_id",
            "username",
            "avatar",
            "bio",
            "is_private",
            "friendship_status",
            "is_banned",
        )

    def get_friendship_status(self, obj):
        if obj.is_banned:
            return "none"
        request = self.context.get("request")

        if request is None or request.user.is_anonymous:
            return None

        if request.user == obj.user:
            return "self"

        friendship = Friendship.objects.filter(
            (
                Q(sender=request.user, receiver=obj.user)
                | Q(sender=obj.user, receiver=request.user)
            )
        ).first()

        if friendship is None:
            return "none"

        if friendship.status == FriendshipStatus.ACCEPTED:
            return "friends"

        if friendship.status == FriendshipStatus.PENDING:
            if friendship.sender == request.user:
                return "requested"

            return "incoming_request"

        return "none"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_banned:
            data.update({
                "username": "Banned user",
                "avatar": None,
                "bio": None,
                "friendship_status": "none",
            })
        return data
