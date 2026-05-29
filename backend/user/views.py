import logging
import uuid
<<<<<<< HEAD
=======

>>>>>>> recovered-rebase

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
<<<<<<< HEAD
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
=======
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
>>>>>>> recovered-rebase
from requests import RequestException
from rest_framework.decorators import api_view, action, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets, mixins
from google.oauth2 import id_token
from google.auth.transport import requests
from django.core.files.base import ContentFile
import requests as pyrequests
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.pagination import DefaultPagination
from event.models import Event, EventStatus, EventType
from event.serializers import EventSerializer
from .models import (
    SocialAccount,
    Profile,
    Friendship,
    FriendInvite
)

from .permissions import IsOwnerOrReadOnly
from .serializers import (
    EmailSerializer,
    VerifyCodeSerializer,
    SetPasswordSerializer,
    ProfileSerializer,
    ProfileReadSerializer,
    OnboardingSerializer,
    AvatarSerializer,
    SetNewPasswordSerializer,
    ChangePasswordSerializer,
    FriendshipSerializer,
    FriendSerializer,
    UserSerializer,
    MutualFriendsSerializer,
    InviteSerializer,
    InviteUseSerializer,
    EmailStartResponseSerializer, FriendshipRequestSerializer
)
from .services.auth_service import AuthService
from .services.friendship_service import FriendshipService
from .services.invite_service import InviteService


logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    rate = "5/min"


@api_view(["POST"])
def google_auth(request):
    token = request.data.get("token")

    if not token:
        return Response({"error": "No token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID
        )
    except ValueError:
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    email = idinfo.get("email")
    google_id = idinfo.get("sub")
    email_verified = idinfo.get("email_verified")

    first_name = idinfo.get("given_name")
    last_name = idinfo.get("family_name")
    avatar_url = idinfo.get("picture")

    if not email or not google_id:
        return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

    if not email_verified:
        return Response({"error": "Email not verified"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        social = SocialAccount.objects.select_related("user").filter(
            provider="google",
            uid=google_id
        ).first()

        if social:
            user = social.user

        else:
            user = User.objects.filter(email=email).first()

            if not user:
                user = User.objects.create_user(
                    email=email,
                    is_active=True,
                    is_verified=True,
                )
                user.set_unusable_password()
                user.save()

                Profile.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                )

            else:
                user.is_verified = True
                user.save()

            SocialAccount.objects.create(
                user=user,
                provider="google",
                uid=google_id
            )

        profile = user.profile

        updated = False

        if first_name and not profile.first_name:
            profile.first_name = first_name
            updated = True

        if last_name and not profile.last_name:
            profile.last_name = last_name
            updated = True

        if avatar_url and not profile.avatar:
            try:
                response = pyrequests.get(avatar_url)

                if response.status_code == 200:
                    profile.avatar.save(
                        f"{user.pk}_google_avatar.jpg",
                        ContentFile(response.content),
                        save=False
                    )
                    updated = True


            except RequestException as e:
                logger.warning(f"Failed to download google avatar: {e}")

        if updated:
            profile.save()

    return AuthService.create_auth_response(user)


@extend_schema(
    request=EmailSerializer,
    responses={
        200: EmailStartResponseSerializer,
    },
)
@api_view(["POST"])
@throttle_classes([LoginThrottle])
def email_start(request):
    serializer = EmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    user_exists = User.objects.filter(email=email).exists()
    if not user_exists:
        AuthService.send_verification_code(email)

    return Response(
        {"flow": "login" if user_exists else "register" },
        status=status.HTTP_200_OK
    )


@extend_schema(
    request=VerifyCodeSerializer,
    responses={
        200: OpenApiResponse(
            description=f"verification_token: {uuid.uuid4()}",
        ),
    },
)
@api_view(["POST"])
def verify_code(request):
    serializer = VerifyCodeSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    code = serializer.validated_data["code"]

    try:
        token = AuthService.verify_code(email, code)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {"verification_token": str(token)},
        status=status.HTTP_200_OK
    )


@extend_schema(
    request=EmailSerializer,
    responses={
        200: OpenApiResponse(
            description=f"Code resent",
        ),
    }
)
@api_view(["POST"])
def resend_code(request):
    serializer = EmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    try:
        AuthService.resend_verification_code(email)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "Code resent"})


@extend_schema(
    request=SetPasswordSerializer,
    responses={
        200: OpenApiResponse(
            description=f"is_verified: True/False and set secure cookies",
        ),
    }
)
@api_view(["POST"])
def set_password(request):
    serializer = SetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data["token"]
    password = serializer.validated_data["password"]

    try:
        user = AuthService.create_user_with_token(token, password)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return AuthService.create_auth_response(user)


@extend_schema(
    request=EmailSerializer,
    responses={
        200: OpenApiResponse(
            description=f"Code sent",
        ),
    }
)
@api_view(["POST"])
def reset_password(request):
    serializer = EmailSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    user_exists = User.objects.filter(email=email).exists()

    if user_exists:
        AuthService.send_verification_code(email, purpose="reset_password")

    return Response(
        {"message": "Code sent"},
        status=status.HTTP_200_OK
    )


@extend_schema(
    request=SetNewPasswordSerializer,
    responses={
        200: OpenApiResponse(
            description=f"Password updated",
        ),
        400: OpenApiResponse(
            description=f"Passwords do not match",
        )
    }
)
@api_view(["POST"])
def set_new_password(request):
    serializer = SetNewPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        AuthService.reset_password_confirm(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"],
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {"message": "Password updated"},
        status=status.HTTP_200_OK
    )


class CookieTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.user

        return AuthService.create_auth_response(user)


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        serializer = self.get_serializer(data={
            "refresh": refresh_token
        })

        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data["access"]

        response = Response({"message": "Token refreshed"})

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )

        return response


@extend_schema(
    request=EmailSerializer,
    responses={
        200: OpenApiResponse(
            description=f"Logout by deleting cookies",
        ),
    }
)
@api_view(["POST"])
def logout_user(request):
    response = Response(
        {"message": "Logged out"},
        status=status.HTTP_200_OK
    )

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return response


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.select_related("user", "city")
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)
    pagination_class = DefaultPagination

    def get_queryset(self):
        queryset = self.queryset
        username = self.request.query_params.get("username")

        if username:
            queryset = queryset.filter(username__icontains=username)

        return queryset

    def get_serializer_class(self):
        if self.action in ("list", "retrieve", "me"):
            return ProfileReadSerializer
        elif self.action == "onboarding":
            return OnboardingSerializer
        elif self.action == "upload_avatar":
            return AvatarSerializer
        elif self.action == "change_password":
            return ChangePasswordSerializer
        return ProfileSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="username",
                type=OpenApiTypes.STR,
                description="Filter by username(icontains)",
            ),

        ]
    )
    def list(self, request, *args, **kwargs):
        """Returns a filtered list of user profiles."""
        return super(ProfileViewSet, self).list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(
            profile
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get", "patch"])
    def update_profile(self, request):
        profile = request.user.profile
        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=["patch"], url_path="onboarding")
    def onboarding(self, request):
        profile = request.user.profile

        serializer = self.get_serializer(
            profile,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["username"] == "":
            return Response(
                {"error": "username required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        profile.is_onboarded = True
        profile.save()

        return Response(serializer.data)

    @action(detail=False, methods=["patch"], url_path="avatar")
    def upload_avatar(self, request):
        serializer = self.get_serializer(
            request.user.profile,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"error": "Wrong password"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if serializer.validated_data["old_password"] == serializer.validated_data["new_password"]:
            return Response({"error": "New password must be different"}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"message": "Password changed"})


class FriendshipViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet
):
    queryset = Friendship.objects.select_related("sender__profile", "receiver__profile")
    serializer_class = FriendshipSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = DefaultPagination

    def get_queryset(self):
        return self.queryset.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        )

    def destroy(self, request, *args, **kwargs):
        friendship = self.get_object()

        FriendshipService.delete_friendship(friendship, request.user)

        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        request=FriendshipRequestSerializer,
        responses={
            200: OpenApiResponse(description="request sent"),
            400: OpenApiResponse(
                description="Friendship request already exists"
            ),
        }
    )
    @action(detail=False, methods=["post"])
    def send(self, request):
        serializer = FriendshipRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        FriendshipService.send_request(
            sender=request.user,
            receiver=serializer.validated_data["receiver"]
        )

        return Response(
            {"status": "request sent"},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        friendship = self.get_object()
        user = request.user

        FriendshipService.accept_request(friendship, user)

        return Response(
            {"detail": f"Accepted"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        friendship = self.get_object()
        user = request.user

        FriendshipService.decline_request(friendship, user)

        return Response(
            {"success": "Declined"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"])
    def incoming(self, request):
        queryset = FriendshipService.get_incoming_requests(request.user)
        serializer = FriendshipSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def friends(self, request):
        """Friends of request.user"""
        friends = FriendshipService.get_friends(request.user)

        page = self.paginate_queryset(friends)
        if page is not None:
            serializer = FriendSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = FriendSerializer(friends, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = DefaultPagination

    @action(detail=True, methods=["get"])
    def friends(self, request, pk=None):
        user = self.get_object()
        friends = FriendshipService.get_friends(user)

        page = self.paginate_queryset(friends)
        if page is not None:
            serializer = FriendSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = FriendSerializer(friends, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def mutual_friends(self, request, pk=None):
        target_user = self.get_object()

        users = FriendshipService.get_mutual_friends(
            request.user,
            target_user
        )

        serializer = MutualFriendsSerializer(users, many=True)
        return Response(serializer.data)

<<<<<<< HEAD
=======

>>>>>>> recovered-rebase
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="tab",
                type=OpenApiTypes.STR,
                description="Type of the event to filter in profile plans"
                            "(example:?tab=plans/wishes/archive)",
            ),
            OpenApiParameter(
                name="sort",
                type=OpenApiTypes.STR,
                description="Sort parameter in profile events"
                            "(recently added -> by default "
                            "/ ?sort=soonest -> soonest first)",
            )
        ]
    )
    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        user = self.get_object()
        events = Event.objects.filter(
            Q(creator=user) | Q(participants__user=user)
        ).select_related(
            "category",
            "creator__profile",
        ).distinct()
        tab = self.request.query_params.get("tab")
        sort = self.request.query_params.get("sort")

        if sort == "soonest":
            events = events.order_by(
                "event_date",
                "event_time",
            )

        if tab == "plans":
            events = events.filter(
                status__in=(EventStatus.ACTIVE, EventStatus.CLOSED),
                event_type=EventType.PLAN
            )

        if tab == "wishes":
            events = events.filter(
                status__in=(EventStatus.ACTIVE, EventStatus.CLOSED),
                event_type=EventType.WISH
            )

        if tab == "archive":
            events = events.filter(
                status=EventStatus.COMPLETED,
            )

        page = self.paginate_queryset(events)

        if page is not None:
            serializer = EventSerializer(page, many=True,)
            return self.get_paginated_response(
                serializer.data
            )

        serializer = EventSerializer(events, many=True,)

        return Response(serializer.data)


class InviteViewSet(
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = FriendInvite.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = InviteSerializer

    def create(self, request, *args, **kwargs):
        invite = InviteService.create_invite(request.user)

        serializer = InviteSerializer(
            invite,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def use(self, request):
        serializer = InviteUseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        InviteService.use_invite(
            serializer.validated_data["token"],
            request.user
        )

        return Response({"detail": "Invite accepted"})


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok"}, status=status.HTTP_200_OK)


@extend_schema(
    summary="Check username availability",
    description=(
        "Checks whether the provided username is available for registration."
    ),
    parameters=[
        OpenApiParameter(
            name="username",
            type=str,
            location=OpenApiParameter.QUERY,
            required=True,
            description="Username to check.",
        ),
    ],
    responses={
        200: OpenApiResponse(
            description="Username availability status.",
            response={
                "type": "object",
                "properties": {
                    "available": {
                        "type": "boolean",
                        "example": True,
                    },
                },
            },
        ),
        400: OpenApiResponse(
            description="Validation error.",
        ),
    },
    examples=[
        OpenApiExample(
            "Username available",
            value={"available": True},
            response_only=True,
            status_codes=["200"],
        ),
        OpenApiExample(
            "Username taken",
            value={"available": False},
            response_only=True,
            status_codes=["200"],
        ),
        OpenApiExample(
            "Missing username",
            value={"detail": "username is required"},
            response_only=True,
            status_codes=["400"],
        ),
    ],
)
class UsernameAvailabilityAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get("username")

        if not username:
            return Response(
                {"detail": "username is required"},
                status=400,
            )

        if len(username) < 3:
            return Response({"available": False})

        is_taken = Profile.objects.filter(
            username__iexact=username
        ).exists()

        return Response({
            "available": not is_taken
        })
