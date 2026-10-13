def delete_staged_image(image):
    """Delete a staged moderation upload immediately."""
    if image:
        image.delete(save=False)
