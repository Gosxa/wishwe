from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SocialAccount, Profile

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
