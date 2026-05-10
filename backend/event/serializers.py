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


class WishWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "category",
            "title",
            "description",
            "cover_image",
            "location",
            "external_link",
            "timeframe_text",
            "min_participants",
            "expires_at",
        )

    def validate(self, attrs):
        instance = self.instance

        if (
            instance
            and instance.status in (
                EventStatus.COMPLETED,
                EventStatus.CANCELLED,
            )
        ):
            raise serializers.ValidationError(
                "Completed or cancelled events cannot be edited."
            )

        timeframe_text = attrs.get(
            "timeframe_text",
            instance.timeframe_text if instance else None,
        )

        if not timeframe_text:
            raise serializers.ValidationError({
                "timeframe_text":
                    "Wish events require timeframe_text."
            })

        return attrs

    def create(self, validated_data):
        validated_data["creator"] = self.context["request"].user
        validated_data["event_type"] = EventType.WISH

        return super().create(validated_data)


class PlanWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "id",
            "category",
            "title",
            "description",
            "cover_image",
            "location",
            "external_link",
            "event_date",
            "event_time",
            "min_participants",
            "max_participants",
            "expires_at",
        )

    def validate(self, attrs):
        instance = self.instance
        if (
            instance
            and instance.status in (
                EventStatus.COMPLETED,
                EventStatus.CANCELLED,
            )
        ):
            raise serializers.ValidationError(
                "Completed or cancelled events cannot be edited."
            )

        min_participants = attrs.get(
            "min_participants",
            instance.min_participants if instance else None,
        )

        max_participants = attrs.get(
            "max_participants",
            instance.max_participants if instance else None,
        )

        if max_participants < min_participants:
            raise serializers.ValidationError({
                "max_participants":
                    "max_participants cannot be less than min_participants."
            })

        event_date = attrs.get(
            "event_date",
            instance.event_date if instance else None,
        )

        event_time = attrs.get(
            "event_time",
            instance.event_time if instance else None,
        )

        if not event_date:
            raise serializers.ValidationError({
                "event_date":
                    "Plan events require event_date."
            })

        if not event_time:
            raise serializers.ValidationError({
                "event_time":
                    "Plan events require event_time."
            })

        return attrs

    def create(self, validated_data):
        validated_data["creator"] = self.context["request"].user
        validated_data["event_type"] = EventType.PLAN

        return super().create(validated_data)
