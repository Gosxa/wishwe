from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        return bool(
            request.method in SAFE_METHODS
            or obj.creator == request.user
        )


class CanUsePlatformUnlessBanned(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or not request.user.is_authenticated:
            return True

        profile = getattr(request.user, "profile", None)
        return profile is None or not profile.is_banned
