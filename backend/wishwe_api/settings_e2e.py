"""Django settings used only by the Playwright test suite."""

import os
from pathlib import Path

if os.getenv("WISHWE_E2E") != "1":
    raise RuntimeError(
        "wishwe_api.settings_e2e may only be used with WISHWE_E2E=1"
    )

from .settings import *


IS_E2E = True
DEBUG = True
SECRET_KEY = os.getenv(
    "WISHWE_E2E_SECRET_KEY",
    "wishwe-playwright-isolated-secret-key-not-for-production",
)
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

E2E_ROOT = Path(
    os.getenv("WISHWE_E2E_ROOT", BASE_DIR / ".e2e")
).resolve()
E2E_ROOT.mkdir(parents=True, exist_ok=True)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.getenv(
            "WISHWE_E2E_DATABASE_PATH",
            str(E2E_ROOT / "db.sqlite3"),
        ),
    }
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

AWS_STORAGE_BUCKET_NAME = None
AWS_S3_CUSTOM_DOMAIN = None
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {"location": str(E2E_ROOT / "media")},
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
MEDIA_ROOT = E2E_ROOT / "media"

FRONTEND_URL = os.getenv(
    "WISHWE_E2E_FRONTEND_URL",
    "http://127.0.0.1:3100",
)
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CSRF_TRUSTED_ORIGINS = [FRONTEND_URL]

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
