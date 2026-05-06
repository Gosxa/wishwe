import uuid
import random
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction

from user.models import Profile, EmailVerification


User = get_user_model()
COOLDOWN_SECONDS = 60


class AuthService:

    @staticmethod
    def generate_code():
        return str(random.randint(100000, 999999))

    @staticmethod
    def send_verification_code(email: str, purpose: str = "registration"):
        code = AuthService.generate_code()

        verification, _ = EmailVerification.objects.update_or_create(
            email=email,
            defaults={
                "code": code,
                "expires_at": timezone.now() + timedelta(minutes=10),
                "attempts": 0,
                "is_verified": False,
                "purpose": purpose,
            }
        )

        send_mail(
            subject="Your verification code",
            message=f"Your code is {code}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
        )

        return code

    @staticmethod
    def resend_verification_code(email: str):
        verification = EmailVerification.objects.filter(email=email).first()

        if verification:
            last_sent = verification.updated_at

            if timezone.now() < last_sent + timedelta(seconds=COOLDOWN_SECONDS):
                remaining = (
                        last_sent + timedelta(seconds=COOLDOWN_SECONDS) - timezone.now()
                ).seconds

                raise ValueError(f"Try again in {remaining} seconds")

        return AuthService.send_verification_code(email)

    @staticmethod
    def verify_code(email: str, code: str):
        verification = EmailVerification.objects.filter(email=email).first()

        if not verification:
            raise ValueError("Verification not found")

        if verification.expires_at < timezone.now():
            raise ValueError("Code expired")

        if verification.attempts >= 5:
            raise ValueError("Too many attempts")

        if verification.code != code:
            verification.attempts += 1
            verification.save()
            raise ValueError("Invalid code")

        verification.is_verified = True
        verification.token = uuid.uuid4()
        verification.save()

        return verification.token

    @staticmethod
    def create_user_with_token(token, password: str):
        verification = EmailVerification.objects.filter(
            token=token,
            is_verified=True
        ).first()

        if not verification:
            raise ValueError("Invalid or expired token")

        with transaction.atomic():
            if User.objects.filter(email=verification.email).exists():
                raise ValueError("User already exists")

            user = User.objects.create(
                email=verification.email,
                is_active=True,
                is_verified=True,
            )

            user.set_password(password)
            user.save()

            Profile.objects.create(user=user)

            verification.delete()

        return user

    @staticmethod
    def reset_password_confirm(token, new_password: str):
        verification = EmailVerification.objects.filter(
            token=token,
            purpose="reset_password",
            is_verified=True
        ).first()

        if not verification:
            raise ValueError("Invalid token")

        if verification.expires_at < timezone.now():
            raise ValueError("Token expired")

        if verification.attempts >= 5:
            raise ValueError("Too many attempts")

        user = User.objects.filter(email=verification.email).first()

        if not user:
            raise ValueError("Invalid request")

        user.set_password(new_password)
        user.save()

        verification.delete()

        return user
