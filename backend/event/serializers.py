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
