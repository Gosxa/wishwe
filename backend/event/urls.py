from django.urls import path, include
from rest_framework.routers import DefaultRouter

from event.views import CategoryViewSet


router = DefaultRouter()
router.register("category", CategoryViewSet)

urlpatterns = [
    path("", include(router.urls)),
]

app_name = "events"
