from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.select_related(
        "creator__profile",
        "recipient__profile",
    )
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = self.queryset.filter(
            recipient=self.request.user
        ).order_by("-created_at")

        return queryset
