from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from event.models import (
    Category,
    Event,
    EventStatus,
    EventType
)
from event.serializers import (
    CategorySerializer,
    EventSerializer,
    PlanWriteSerializer,
    WishWriteSerializer
)
from event.services.event_service import EventService


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]

        return [permissions.IsAdminUser()]


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventSerializer
    permission_classes = (permissions.IsAuthenticated,)
    _visible_users_ids = None

    def get_visible_users_ids(self):
        if self._visible_users_ids is None:
            self._visible_users_ids = (
                EventService.get_visible_users_ids(
                    self.request.user
                )
            )

        return self._visible_users_ids

    def get_queryset(self):
        visible_users_ids = self.get_visible_users_ids()

        queryset = Event.objects.filter(
            creator_id__in=visible_users_ids,
            status=EventStatus.ACTIVE,
        ).select_related(
            "creator__profile",
            "category",
        ).order_by("-created_at")

        event_type = self.request.query_params.get("type")

        if event_type in (
            EventType.WISH,
            EventType.PLAN,
        ):
            queryset = queryset.filter(
                event_type=event_type
            )

        return queryset

    def get_serializer_class(self):
        if self.action == "create_wish":
            return WishWriteSerializer

        if self.action == "create_plan":
            return PlanWriteSerializer

        return EventSerializer

    @action(detail=False, methods=["post"])
    def create_wish(self, request):
        serializer = self.get_serializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        event = EventService.create_wish(
            creator=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(
            EventSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def create_plan(self, request):
        serializer = self.get_serializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        event = EventService.create_plan(
            creator=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(
            EventSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )
