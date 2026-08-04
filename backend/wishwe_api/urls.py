import os
import re

from debug_toolbar.toolbar import debug_toolbar_urls
from django.conf import settings
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from user.views import health_check, UsernameAvailabilityAPIView


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/", include("user.urls", namespace="user")),
    path("api/event/", include("event.urls", namespace="events")),
    path("api/notifications/", include("notifications.urls", namespace="notifications")),
    path("api/health/", health_check, name="health_check"),
    path(
        "api/username-check/",
        UsernameAvailabilityAPIView.as_view(),
        name="username_availability"
    ),
    path("api/doc/", SpectacularAPIView.as_view(), name="schema"),
    path("api/doc/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
] + debug_toolbar_urls()

# Serve user-uploaded media from the local filesystem during development.
# In production media is served from S3/CloudFront (AWS_S3_CUSTOM_DOMAIN),
# so this is only needed for local work.
#
# The route is written out by hand because Django's `static()` helper is a no-op
# whenever DEBUG is False — and DEBUG is hardcoded False in settings.py — which
# made every uploaded avatar 404 on a dev machine. Switch it on with
# SERVE_MEDIA_LOCALLY=true in backend/.env; deployed environments leave the
# variable unset and keep serving media from CloudFront.
_serve_media_locally = os.getenv("SERVE_MEDIA_LOCALLY", "false").lower() == "true"

if (settings.DEBUG or _serve_media_locally) and not settings.AWS_S3_CUSTOM_DOMAIN:
    urlpatterns += [
        re_path(
            rf"^{re.escape(settings.MEDIA_URL.lstrip('/'))}(?P<path>.*)$",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        )
    ]
