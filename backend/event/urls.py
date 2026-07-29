from django.urls import path, include
from rest_framework.routers import DefaultRouter

from event.views import (
    CategoryViewSet,
    EventViewSet,
    ShareView
)


router = DefaultRouter()
router.register("category", CategoryViewSet)
router.register("events", EventViewSet, basename="event")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "share/<uuid:token>/",
        ShareView.as_view(),
        name="event-share",
    )
]

app_name = "events"
