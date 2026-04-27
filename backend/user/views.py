from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.decorators import api_view, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SocialAccount, Profile
from django.core.mail import send_mail

from .permissions import IsOwnerOrReadOnly
from .serializers import RequestCodeSerializer, VerifyCodeSerializer, SetPasswordSerializer, ProfileSerializer, \
    ProfileReadSerializer, OnboardingSerializer, AvatarSerializer
from .services.auth_service import AuthService


User = get_user_model()


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
                    username=email.split("@")[0],
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
    })


@api_view(["POST"])
def request_code(request):
    serializer = RequestCodeSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    code = AuthService.send_verification_code(email)

    send_mail(
        subject="Your verification code",
        message=f"Your code is {code}",
        from_email="no-reply@example.com",
        recipient_list=[email],
    )

    return Response(
        {"message": "Verification code sent"},
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
    })


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

    @action(detail=False, methods=["get", "put", "patch"])
    def update_profile(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(
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
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=["get", "put", "patch"], url_path="avatar")
    def upload_avatar(self, request):
        serializer = self.get_serializer(
            request.user.profile,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)
