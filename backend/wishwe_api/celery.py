import os

from celery import Celery
from celery.schedules import crontab


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wishwe_api.settings", )

app = Celery("wishwe_api")

app.config_from_object(
    "django.conf:settings",
    namespace="CELERY",
)

app.autodiscover_tasks()

app.conf.beat_schedule = {
    "expire-moderation-violations-daily": {
        "task": "user.tasks.expire_moderation_violations",
        "schedule": crontab(hour=2, minute=30),
    },
}
