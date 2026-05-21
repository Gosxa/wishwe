from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.CharField(
        source="recipient.profile.username",
        read_only=True
    )
    creator = serializers.CharField(
        source="creator.profile.username",
        read_only=True
    )

    class Meta:
        model = Notification
        fields = (
            "id",
            "title",
            "message",
            "type",
            "recipient",
            "creator",
            "related_object_type",
            "related_object_id",
            "is_read",
            "created_at",
        )
        read_only_fields = fields
