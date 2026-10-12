import os
from functools import lru_cache

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import Storage, storages
from django.utils.deconstruct import deconstructible
from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    """User-uploaded files → r2://bucket/media/"""
    location = "media"
    file_overwrite = False
    endpoint_url = os.getenv("AWS_S3_ENDPOINT_URL")


class StaticStorage(S3Boto3Storage):
    """Collected static files → r2://bucket/static/"""
    location = "static"
    file_overwrite = True
    endpoint_url = os.getenv("AWS_S3_ENDPOINT_URL")


@lru_cache(maxsize=4)
def _private_moderation_storage(bucket_name, endpoint_url, region_name,
                                access_key, secret_key):
    return S3Boto3Storage(
        bucket_name=bucket_name,
        location="",
        endpoint_url=endpoint_url,
        region_name=region_name,
        access_key=access_key,
        secret_key=secret_key,
        # Empty string explicitly disables AWS_S3_CUSTOM_DOMAIN; None would
        # inherit the public media CDN configured in Django settings.
        custom_domain="",
        querystring_auth=True,
        default_acl=None,
        file_overwrite=False,
    )


@deconstructible
class ModerationUploadStorage(Storage):
    """Use local storage in development and a private R2 bucket in prod."""

    def _backend(self):
        if settings.DEBUG:
            return storages["default"]

        bucket_name = os.getenv("MODERATION_S3_BUCKET_NAME")
        if not bucket_name:
            raise ImproperlyConfigured(
                "MODERATION_S3_BUCKET_NAME must point to a private bucket."
            )

        return _private_moderation_storage(
            bucket_name,
            os.getenv("AWS_S3_ENDPOINT_URL"),
            os.getenv("AWS_S3_REGION_NAME", "auto"),
            os.getenv("AWS_ACCESS_KEY_ID"),
            os.getenv("AWS_SECRET_ACCESS_KEY"),
        )

    def _open(self, name, mode="rb"):
        return self._backend().open(name, mode)

    def _save(self, name, content):
        return self._backend().save(name, content)

    def delete(self, name):
        return self._backend().delete(name)

    def exists(self, name):
        return self._backend().exists(name)

    def listdir(self, path):
        return self._backend().listdir(path)

    def size(self, name):
        return self._backend().size(name)

    def url(self, name):
        return self._backend().url(name)

    def path(self, name):
        return self._backend().path(name)
