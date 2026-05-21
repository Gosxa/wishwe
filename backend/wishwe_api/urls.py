from debug_toolbar.toolbar import debug_toolbar_urls
from django.contrib import admin
from django.urls import path, include
<<<<<<< HEAD
=======
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

>>>>>>> develop
from user.views import health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/", include("user.urls", namespace="user")),
<<<<<<< HEAD
    path("api/health/", health_check, name="health_check"),
=======
    path("api/event/", include("event.urls", namespace="events")),
    path("api/notifications/", include("notifications.urls", namespace="notifications")),
    path("api/health/", health_check, name="health_check"),
    path("api/doc/", SpectacularAPIView.as_view(), name="schema"),
    path("api/doc/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
>>>>>>> develop
] + debug_toolbar_urls()
