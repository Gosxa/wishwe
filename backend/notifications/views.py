from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.pagination import DefaultPagination
from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationPagination(DefaultPagination):
    page_size = 10


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.select_related(
        "creator__profile",
        "recipient__profile",
    )
    serializer_class = NotificationSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = NotificationPagination

    def get_queryset(self):
        queryset = self.queryset.filter(
            recipient=self.request.user
        ).order_by("-created_at")

        is_read = self.request.query_params.get("read")

        if is_read is not None:
            queryset = queryset.filter(
                is_read=is_read.lower() == "true"
            )

        return queryset

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()

        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        updated_count = self.get_queryset().filter(
            is_read=False
        ).update(is_read=True)

        return Response(
            {"updated": updated_count},
            status=status.HTTP_200_OK,
        )
