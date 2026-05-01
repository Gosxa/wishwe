from django.utils import timezone
from datetime import timedelta
import uuid
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings

from user.models import EmailVerification


User = get_user_model()


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"
)
class AuthFlowTests(APITestCase):

    def setUp(self):
        self.email = "test@gmail.com"
        self.password = "testpass123"

    def test_email_start_register(self):
        url = reverse("user:email_start")

        response = self.client.post(url, {"email": self.email})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["flow"], "register")
        self.assertEqual(len(mail.outbox), 1)

    def test_email_start_login(self):
        User.objects.create_user(email=self.email, password=self.password)

        url = reverse("user:email_start")
        response = self.client.post(url, {"email": self.email})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["flow"], "login")

    def test_verify_code_success(self):
        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        url = reverse("user:verify_code")

        response = self.client.post(url, {
            "email": self.email,
            "code": "123456"
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn("verification_token", response.data)

    def test_set_password_creates_user(self):
        verification = EmailVerification.objects.create(
            email=self.email,
            code="123456",
            is_verified=True,
            token=uuid.uuid4(),
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        url = reverse("user:set_password")

        response = self.client.post(url, {
            "token": verification.token,
            "password": self.password
        })

        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.filter(email=self.email).exists())

    def test_login_jwt(self):
        User.objects.create_user(email=self.email, password=self.password)

        url = reverse("user:token_obtain_pair")

        response = self.client.post(url, {
            "email": self.email,
            "password": self.password
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_reset_password_sends_email(self):
        User.objects.create_user(email=self.email, password=self.password)

        url = reverse("user:reset_password")

        response = self.client.post(url, {"email": self.email})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

    def test_set_new_password(self):
        user = User.objects.create_user(email=self.email, password="oldpass123")

        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
            purpose="reset_password"
        )

        url = reverse("user:set_new_password")

        response = self.client.post(url, {
            "email": self.email,
            "code": "123456",
            "new_password": "newpass123"
        })

        self.assertEqual(response.status_code, 200)

        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))

    def test_change_password(self):
        user = User.objects.create_user(email=self.email, password="oldpass123")

        self.client.force_authenticate(user=user)

        url = reverse("user:profile-change-password")

        response = self.client.post(url, {
            "old_password": "oldpass123",
            "new_password": "newpass123"
        })

        self.assertEqual(response.status_code, 200)

        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))

    def test_verify_code_invalid(self):
        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        url = reverse("user:verify_code")

        response = self.client.post(url, {
            "email": self.email,
            "code": "000000"
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_verify_code_expired(self):
        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            expires_at=timezone.now() - timedelta(minutes=1)
        )

        url = reverse("user:verify_code")

        response = self.client.post(url, {
            "email": self.email,
            "code": "123456"
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_verify_code_attempts_limit(self):
        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            attempts=5,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        url = reverse("user:verify_code")

        response = self.client.post(url, {
            "email": self.email,
            "code": "123456"
        })

        self.assertEqual(response.status_code, 400)

    def test_resend_code_cooldown(self):
        EmailVerification.objects.create(
            email=self.email,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
            updated_at=timezone.now()
        )

        url = reverse("user:resend_code")

        response = self.client.post(url, {"email": self.email})

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_change_password_wrong_old(self):
        user = User.objects.create_user(
            email=self.email,
            password="oldpass123"
        )

        self.client.force_authenticate(user=user)

        url = reverse("user:profile-change-password")

        response = self.client.post(url, {
            "old_password": "wrongpass",
            "new_password": "newpass123"
        })

        self.assertEqual(response.status_code, 400)

    def test_change_password_same(self):
        user = User.objects.create_user(
            email=self.email,
            password="samepass123"
        )

        self.client.force_authenticate(user=user)

        url = reverse("user:profile-change-password")

        response = self.client.post(url, {
            "old_password": "samepass123",
            "new_password": "samepass123"
        })

        self.assertEqual(response.status_code, 400)
