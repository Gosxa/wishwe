from uuid import UUID

from django.db.models import Prefetch, Q, Count
from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse, OpenApiExample
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import DefaultPagination
from event.models import (
    Category,
    Event,
    EventParticipant,
    EventStatus,
    EventType,
    EventVisibility,
    ParticipationStatus,
)
from event.permissions import IsOwnerOrReadOnly
from event.serializers import (
    CategorySerializer,
    EventSerializer,
    PlanWriteSerializer,
    WishWriteSerializer,
    ConvertWishToPlanSerializer,
    ParticipantSerializer,
    SharedEventResponseSerializer,
    ShareLinkSerializer
)
from event.services.event_service import EventService
from event.services.share_service import EventShareService


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]

        return [permissions.IsAdminUser()]


class EventViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = EventSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    pagination_class = DefaultPagination

    def get_queryset(self):
        visibility = self.request.query_params.get(
            "visible"
        )

        friend_ids = EventService.get_user_friend_ids(
            self.request.user
        )

        query_filter = Q(
            creator_id__in=friend_ids
        )

        if visibility in (None, "all"):
            fof_ids = EventService.get_friends_of_friends_ids(
                self.request.user,
                friend_ids
            )

            query_filter |= Q(
                creator_id__in=fof_ids,
                event_visibility=(
                    EventVisibility.FRIENDS_OF_FRIENDS
                ),
            )

        queryset = Event.objects.filter(
            query_filter,
            status__in=(
                EventStatus.ACTIVE,
                EventStatus.CLOSED,
            ),
        ).select_related(
            "creator__profile",
            "category",
        ).prefetch_related(
            Prefetch(
                "participants",
                queryset=EventParticipant.objects.filter(
                    status__in=(
                        ParticipationStatus.JOINED,
                        ParticipationStatus.INTERESTED,
                    ),
                ).select_related("user__profile").order_by("joined_at")[:6],
                to_attr="preview_participants",
            )
        )

        event_type = self.request.query_params.get("type")
        title = self.request.query_params.get("title")
        sort = self.request.query_params.get("sort")

        if sort == "soonest":
            queryset = queryset.order_by(
                "event_date",
                "event_time",
            )

        if event_type in (
            EventType.WISH,
            EventType.PLAN,
        ):
            queryset = queryset.filter(
                event_type=event_type
            )

        if sort == "heat" and event_type == EventType.PLAN:
            queryset = queryset.annotate(
                social_heat=Count(
                    "participants",
                    filter=Q(
                        participants__user_id__in=friend_ids,
                        participants__status=ParticipationStatus.JOINED,
                    )
                )
            ).order_by("-social_heat", "-created_at")

        if sort == "heat" and event_type == EventType.WISH:
            queryset = queryset.annotate(
                social_heat=Count(
                    "participants",
                    filter=Q(
                        participants__user_id__in=friend_ids,
                        participants__status=ParticipationStatus.INTERESTED,
                    )
                )
            ).order_by("-social_heat", "-created_at")

        if title:
            queryset = queryset.filter(title__icontains=title)

        if self.action == "list":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "participants",
                    queryset=EventParticipant.objects.filter(
                        user=self.request.user
                    ),
                    to_attr="current_user_participation",
                )
            )

        return queryset

    def get_serializer_class(self):
        if self.action in ("create_wish", "update_wish"):
            return WishWriteSerializer

        if self.action in ("create_plan", "update_plan"):
            return PlanWriteSerializer

        if self.action == "convert_to_plan":
            return ConvertWishToPlanSerializer

        return EventSerializer

    def perform_destroy(self, instance):
        EventService.delete_event(event=instance)

    def get_serializer_context(self):
        context = super().get_serializer_context()

        context["friend_ids"] = (
            EventService.get_user_friend_ids(
                self.request.user
            )
        )

        return context

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="type",
                type=OpenApiTypes.STR,
                description="Type of the event to filter in the feed(plan/wish)",
            ),
            OpenApiParameter(
                name="visible",
                type=OpenApiTypes.STR,
                description="Type of event visibility to filter in the feed(f-o-f/friends_only). "
                            "All updates -> by default | ?visible=all /"
                            "Friends only -> ?visible=friends",
            ),
            OpenApiParameter(
                name="title",
                type=OpenApiTypes.STR,
                description="Filtering by title",
            ),
            OpenApiParameter(
                name="sort",
                type=OpenApiTypes.STR,
                description="Sort parameter in feed(recently added -> by default "
                            "/ ?sort=soonest -> soonest first)"
                            "/ ?sort=heat -> sorting by joined/interested friends count",
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        """Returns a filtered list of events."""
        return super(EventViewSet, self).list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        event = get_object_or_404(
            Event.objects.select_related("creator"),
            pk=kwargs["pk"],
        )

        if not EventService.can_view(request.user, event):
            raise PermissionDenied(
                "You don't have permission to view this event."
            )

        serializer = self.get_serializer(event)
        return Response(serializer.data)

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
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data,
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
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True,methods=["patch"], )
    def update_wish(self, request, pk=None):
        event = self.get_object()
        serializer = self.get_serializer(
            event,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        event = EventService.update_wish(
            event=event,
            validated_data=serializer.validated_data,
        )

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"], )
    def update_plan(self, request, pk=None):
        event = self.get_object()
        serializer = self.get_serializer(
            event,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        event = EventService.update_plan(
            event=event,
            validated_data=serializer.validated_data,
        )

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=(permissions.IsAuthenticated,),
    )
    def join_plan(self, request, pk=None):
        event = self.get_object()

        event = EventService.join_plan(
            event=event,
            user=request.user,
        )

        event = self.get_queryset().get(pk=event.pk)

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data,
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=(permissions.IsAuthenticated,),
    )
    def interested_in_wish(self, request, pk=None):
        event = self.get_object()

        event = EventService.interested_in_wish(
            event=event,
            user=request.user,
        )

        event = self.get_queryset().get(pk=event.pk)

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=(permissions.IsAuthenticated,),
    )
    def leave_event(self, request, pk=None):
        event = self.get_object()

        event = EventService.leave_event(
            event=event,
            user=request.user,
        )

        event = self.get_queryset().get(pk=event.pk)

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
    )
    def archive_plan(self, request, pk=None):
        event = self.get_object()

        if event.event_type == EventType.WISH:
            return Response(
                {"detail": "You can't archive a wish."},
                status=status.HTTP_403_FORBIDDEN,
            )

        event.status = EventStatus.COMPLETED
        event.save()

        return Response(
            {"detail": f"You successfully archived your plan {event.title}"},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="participants"
    )
    def participants(self, request, pk=None):
        event = self.get_object()

        participants = (
            EventParticipant.objects.filter(
                event=event,
                status__in=[
                    ParticipationStatus.JOINED,
                    ParticipationStatus.INTERESTED,
                ]
            )
            .select_related("user__profile")
        )

        serializer = ParticipantSerializer(
            participants,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    @action(detail=True, methods=["post"], )
    def convert_to_plan(self, request, pk=None):
        event = self.get_object()

        serializer = self.get_serializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        event = EventService.convert_wish_to_plan(
            event=event,
            validated_data=serializer.validated_data,
        )

        return Response(
            EventSerializer(
                event,
                context=self.get_serializer_context(),
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=(permissions.IsAuthenticated,),
    )
    def copy_wish(self, request, pk=None):
        event = self.get_object()

        copied_event = EventService.copy_wish(
            event=event,
            user=request.user,
        )

        return Response(
            EventSerializer(
                copied_event,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Create event share link",
        description=(
                "Creates a share link for the specified event. "
                "If the event already has an active share link, "
                "the existing link is returned."
        ),
        responses={
            status.HTTP_200_OK: ShareLinkSerializer,
            status.HTTP_403_FORBIDDEN: OpenApiResponse(
                description="Only the event creator can create a share link."
            ),
            status.HTTP_404_NOT_FOUND: OpenApiResponse(
                description="Event not found."
            ),
        },
        examples=[
            OpenApiExample(
                "Success",
                value={
                    "share_url": (
                            "https://wishwe.online/"
                            "share/ac966711-751a-4da5-a733-223ba91c50e0"
                    ),
                },
                response_only=True,
            ),
        ]
    )
    @action(
        methods=["POST"],
        detail=True,
    )
    def share(self, request, *args, **kwargs):
        event = self.get_object()

        if event.creator != request.user:
            raise PermissionDenied(
                "You can only create share links for your own events."
            )

        EventShareService.create_share_link(event)

        serializer = ShareLinkSerializer(event)

        return Response(serializer.data)


@extend_schema(
    summary="Get shared event preview",
    description=(
        "Returns a shared event by its share token. "
        "If the authenticated user has access to the event, "
        "the full event representation is returned. "
        "Otherwise, only the public event preview is returned."
    ),
    responses={
        status.HTTP_200_OK: SharedEventResponseSerializer,
        status.HTTP_401_UNAUTHORIZED: OpenApiResponse(
            description="Authentication credentials were not provided.",
        ),
        status.HTTP_404_NOT_FOUND: OpenApiResponse(
            description="Share link not found.",
        ),
    },
    examples=[
        OpenApiExample(
            "User has access",
            value={
                "has_access": True,
                "event": {
                    "...": "Full EventSerializer response"
                },
                "preview": None,
            },
            response_only=True,
        ),
        OpenApiExample(
            "User has no access",
            value={
                "has_access": False,
                "event": None,
                "preview": {
                    "...": "EventPreviewSerializer response"
                },
            },
            response_only=True,
        ),
    ],
)
class SharedEventPreviewView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, token: UUID):
        event = EventShareService.get_shared_event(token)

        if event is None:
            raise NotFound("Share link not found.")

        has_access = EventService.can_view(request.user, event)

        serializer = SharedEventResponseSerializer(
            {
                "has_access": has_access,
                "event": event,
            },
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
