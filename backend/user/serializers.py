from rest_framework import serializers

from user.models import Profile


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class SetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(
        min_length=6,
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
    class Meta:
        model = Profile
        fields = (
            "id", "user", "username", "first_name", "last_name",
            "bio", "date_of_birth", "city", "gender", "avatar",
            "social_media_url"
        )
        read_only_fields = ("avatar",)


class ProfileReadSerializer(ProfileSerializer):
    city = serializers.CharField(source="city.name", read_only=True)


class OnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("username", "first_name", "last_name")


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("avatar",)
