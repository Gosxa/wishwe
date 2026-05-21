from rest_framework.exceptions import ValidationError


def validate_image_size(image):
    max_size_mb = 5

    if image.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            f"Max image size is {max_size_mb}MB."
        )


def validate_image_type(image):
    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]

    if image.content_type not in allowed_types:
        raise ValidationError(
            "Only JPEG, PNG and WEBP images are allowed."
        )
