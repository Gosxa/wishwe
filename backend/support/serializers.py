from rest_framework import serializers

from support.models import SupportCategory, SupportRequest


class SupportRequestSerializer(serializers.ModelSerializer):
    category = serializers.ChoiceField(choices=SupportCategory.choices)
    message = serializers.CharField(max_length=5000, trim_whitespace=True)
    display_name = serializers.CharField(
        max_length=100,
        allow_blank=True,
        required=False,
        default="",
    )

    class Meta:
        model = SupportRequest
        fields = ("email", "display_name", "category", "message")

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Please enter a message.")
        return value.strip()
