from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, action, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets, mixins
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    SocialAccount,
    Profile,
    Friendship
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
    UserSerializer, MutualFriendsSerializer
)
from .services.auth_service import AuthService
from .services.friendship_service import FriendshipService


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

        if updated:
            profile.save()

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "is_onboarded": profile.is_onboarded,
    })


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

    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "is_onboarded": user.profile.is_onboarded,
    })


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


@api_view(["POST"])
def set_new_password(request):
    serializer = SetNewPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        AuthService.reset_password_confirm(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["code"],
            new_password=serializer.validated_data["new_password"]
        )
    except ValueError as e:
        return Response({"error": str(e)}, status=400)

    return Response({"message": "Password updated"})


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.select_related("user", "city")
    serializer_class = ProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ProfileReadSerializer
        elif self.action == "onboarding":
            return OnboardingSerializer
        elif self.action == "upload_avatar":
            return AvatarSerializer
        elif self.action == "change_password":
            return ChangePasswordSerializer
        return ProfileSerializer

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

    def get_queryset(self):
        return self.queryset.filter(
            Q(sender=self.request.user) | Q(receiver=self.request.user)
        )

    def destroy(self, request, *args, **kwargs):
        friendship = self.get_object()

        FriendshipService.delete_friendship(friendship, request.user)

        return Response({"detail": "Deleted"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def send(self, request):
        receiver_id = request.data.get("receiver_id")

        FriendshipService.send_request(
            sender=request.user,
            receiver=User.objects.get(id=receiver_id)
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
        friends = FriendshipService.get_friends(request.user)
        serializer = FriendSerializer(friends, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    @action(detail=True, methods=["get"])
    def friends(self, request, pk=None):
        user = self.get_object()

        friends = FriendshipService.get_friends(user)
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
