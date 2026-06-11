from debug_toolbar.toolbar import debug_toolbar_urls
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
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
# so this is only needed for the local DEBUG setup.
if settings.DEBUG and not settings.AWS_S3_CUSTOM_DOMAIN:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
