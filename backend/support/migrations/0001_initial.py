import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SupportRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("email", models.EmailField(max_length=254)),
                (
                    "display_name",
                    models.CharField(blank=True, max_length=100),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("technical_issue", "Technical issue"),
                            ("account_access", "Account and sign-in"),
                            ("feature_idea", "Feature idea"),
                            ("feedback", "Feedback"),
                            ("privacy_data", "Privacy or data request"),
                            ("safety_report", "Safety or abuse report"),
                            ("other", "Other"),
                        ],
                        max_length=32,
                    ),
                ),
                ("message", models.TextField(max_length=5000)),
                (
                    "delivery_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("sent", "Sent"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=12,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "email_sent_at",
                    models.DateTimeField(blank=True, null=True),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="support_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "support request",
                "verbose_name_plural": "support requests",
                "ordering": ("-created_at",),
            },
        ),
    ]
