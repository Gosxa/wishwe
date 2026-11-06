from django.urls import path

from event.consumers import EventFeedConsumer


websocket_urlpatterns = [
    path("ws/events/feed/", EventFeedConsumer.as_asgi()),
]
