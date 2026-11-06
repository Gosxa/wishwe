from http.cookies import SimpleCookie

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(raw_token):
    try:
        token = AccessToken(raw_token)
        return get_user_model().objects.get(pk=token["user_id"])
    except (TokenError, KeyError, get_user_model().DoesNotExist):
        return None


class CookieJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        raw_cookie = headers.get(b"cookie", b"").decode("latin1")
        cookies = SimpleCookie()
        cookies.load(raw_cookie)
        morsel = cookies.get("access_token")
        user = await get_user_from_token(morsel.value) if morsel else None
        return await super().__call__(
            {**scope, "user": user},
            receive,
            send,
        )
