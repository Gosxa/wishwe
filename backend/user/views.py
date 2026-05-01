from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.decorators import api_view, action, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import SocialAccount, Profile

from .permissions import IsOwnerOrReadOnly
from .serializers import (
    EmailSerializer,
    VerifyCodeSerializer,
    SetPasswordSerializer,
    ProfileSerializer,
    ProfileReadSerializer,
    OnboardingSerializer,
    AvatarSerializer,
    SetNewPasswordSerializer
)
from .services.auth_service import AuthService


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
