from storages.backends.s3boto3 import S3Boto3Storage


class MediaStorage(S3Boto3Storage):
    """User-uploaded files → s3://bucket/media/"""
    location = "media"
    file_overwrite = False


class StaticStorage(S3Boto3Storage):
    """Collected static files → s3://bucket/static/"""
    location = "static"
    file_overwrite = True
