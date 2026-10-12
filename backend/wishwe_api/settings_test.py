"""Docker-only settings for the local full-stack moderation environment."""

import os

from .settings import *  # noqa: F403


DEBUG = True
SECRET_KEY = os.getenv("SECRET_KEY", "local-docker-test-only")
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "django"]
FRONTEND_URL = "http://localhost:3000"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "wishwe_test"),
        "USER": os.getenv("DB_USER", "wishwe"),
        "PASSWORD": os.getenv("DB_PASSWORD", "wishwe-local-only"),
        "HOST": os.getenv("DB_HOST", "postgres"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
}

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
MEDIA_ROOT = BASE_DIR / "media"  # noqa: F405
MEDIA_URL = "/media/"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]
