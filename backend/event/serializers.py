from rest_framework import serializers

from common.validators import validate_image_size, validate_image_type
from event.models import (
    Category,
    EventParticipant,
    Event,
    EventType,
    EventStatus,
    EventVisibility,
    ParticipationStatus,
)
from event.services.event_service import EventService


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
        source="user.profile.avatar",
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


class ParticipantPreviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.profile.username",
        read_only=True,
    )
    avatar = serializers.ImageField(
        source="user.profile.avatar",
        read_only=True,
    )

    class Meta:
        model = EventParticipant
        fields = ("username", "avatar")
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    creator = serializers.CharField(
        source="creator.profile.username",
        read_only=True,
    )
    creator_avatar = serializers.ImageField(
        source="creator.profile.avatar",
        read_only=True,
    )
    category = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    mutual_friend = serializers.SerializerMethodField()
    user_participation_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "creator",
            "creator_avatar",
            "mutual_friend",
            "user_participation_status",
            "category",
            "event_type",
            "event_visibility",
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
            "participants_preview",
            "created_at",
            "is_full",
            "available_spots",
        )

        read_only_fields = (
            "creator",
            "event_type",
            "status",
        )

    def get_user_participation_status(self, obj):
        records = getattr(obj, "current_user_participation", None)

        if records is not None:
            record = records[0] if records else None
        else:
            request = self.context.get("request")
            if request is None or not request.user.is_authenticated:
                return None
            record = obj.participants.filter(user=request.user).first()

        if record is None or record.status == ParticipationStatus.LEFT:
            return None
        return record.status

    def get_mutual_friend(self, obj):
        friend_ids = self.context.get("friend_ids")
        if friend_ids is None:
            return None

        if obj.creator_id in friend_ids:
            return None

        if (
                obj.event_visibility
                != EventVisibility.FRIENDS_OF_FRIENDS
        ):
            return None

        mutual_friend = (
            EventService.get_mutual_friend(
                friend_ids,
                obj.creator,
            )
        )

        if not mutual_friend:
            return None

        return {
            "id": mutual_friend.id,
            "username":
                mutual_friend.profile.username,
        }

    def get_participants_preview(self, obj):
        relevant_status = (
            ParticipationStatus.INTERESTED
            if obj.is_wish
            else ParticipationStatus.JOINED
        )
        preview = [
            participant
            for participant in getattr(obj, "preview_participants", [])
            if participant.status == relevant_status
        ][:3]

        return ParticipantPreviewSerializer(
            preview,
            many=True,
            context=self.context,
        ).data


class WishWriteSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(
        validators=[
            validate_image_size,
            validate_image_type,
        ],
        required=False,
    )
    class Meta:
        model = Event
        fields = (
            "id",
            "category",
            "title",
            "description",
            "cover_image",
            "location",
            "timeframe_text",
            "min_participants",
            "event_visibility",
        )

    def validate(self, attrs):
        instance = self.instance

        if (
            instance
            and instance.status in (
                EventStatus.COMPLETED,
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
    cover_image = serializers.ImageField(
        validators=[
            validate_image_size,
            validate_image_type,
        ],
        required=False,
    )
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
            "event_visibility",
        )

    def validate(self, attrs):
        instance = self.instance
        if (
            instance
            and instance.status in (
                EventStatus.COMPLETED,
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

        if max_participants < 2:
            raise serializers.ValidationError({
                "max_participants":
                    "Plan events require at least 2 participants."
            })

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


class ConvertWishToPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = (
            "event_date",
            "event_time",
            "external_link",
            "min_participants",
            "max_participants",
        )

    def validate(self, attrs):
        min_participants = attrs.get(
            "min_participants"
        )
        max_participants = attrs.get(
            "max_participants"
        )

        if max_participants < min_participants:
            raise serializers.ValidationError({
                "max_participants":
                    "max_participants cannot be less than min_participants."
            })

        if max_participants < 2:
            raise serializers.ValidationError({
                "max_participants":
                    "Plan events require at least 2 participants."
            })

        return attrs
