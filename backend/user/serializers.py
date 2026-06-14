from django.contrib.auth import get_user_model
from rest_framework import serializers

from common.validators import validate_image_type, validate_image_size
from user.models import Profile, Friendship, FriendInvite


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
    class Meta:
        model = Profile
        fields = (
            "id", "user", "user_id", "username", "first_name", "last_name",
            "bio", "date_of_birth", "city", "gender", "avatar",
            "social_media_url", "is_private"
        )
        read_only_fields = ("avatar",)


class ProfileReadSerializer(ProfileSerializer):
    city = serializers.CharField(source="city.name", read_only=True)


class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("username", "first_name", "last_name")


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
