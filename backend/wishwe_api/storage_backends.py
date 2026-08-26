from storages.backends.s3boto3 import S3Boto3Storage
import os


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