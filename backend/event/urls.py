from django.urls import path, include
from rest_framework.routers import DefaultRouter

from event.views import CategoryViewSet, EventViewSet


router = DefaultRouter()
router.register("category", CategoryViewSet)
router.register("events", EventViewSet, basename="event")

urlpatterns = [
    path("", include(router.urls)),
]

app_name = "events"
