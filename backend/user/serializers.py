from rest_framework import serializers


class RequestCodeSerializer(serializers.Serializer):
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
