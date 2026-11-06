"""
ASGI config for wishwe_api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wishwe_api.settings")

django_asgi_app = get_asgi_application()

from notifications.routing import websocket_urlpatterns
from notifications.ws_auth import CookieJWTAuthMiddleware


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            CookieJWTAuthMiddleware(URLRouter(websocket_urlpatterns))
        ),
    }
)
