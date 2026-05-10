from rest_framework import serializers

from event.models import (
    Category,
    EventParticipant,
    Event,
    EventType,
    EventStatus
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name")


class EventParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    avatar = serializers.ImageField(
        source="user.avatar",
        read_only=True,
    )

    class Meta:
        model = EventParticipant
        fields = (
            "id",
            "user",
            "username",
            "avatar",
            "status",
            "joined_at",
        )
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    creator = serializers.CharField(
        source="creator.username",
        read_only=True,
    )
    category = CategorySerializer(
        read_only=True,
    )

    class Meta:
        model = Event
        fields = (
            "id",
            "creator",
            "category",
            "event_type",
            "status",
            "title",
            "description",
            "cover_image",
            "location",
            "external_link",
            "event_date",
            "event_time",
            "timeframe_text",
            "min_participants",
            "max_participants",
            "participants_count",
            "interested_count",
            "expires_at",
            "created_at",
            "updated_at",
            "is_full",
            "is_expired",
            "available_spots",
        )

        read_only_fields = (
            "creator",
            "participants_count",
            "interested_count",
            "status",
            "created_at",
            "updated_at",
            "is_full",
            "is_expired",
            "available_spots",
        )
