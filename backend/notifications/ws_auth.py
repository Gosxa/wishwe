import base64
import binascii
from http.cookies import SimpleCookie

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


WS_TICKET_PROTOCOL_PREFIX = "wishwe-auth."
WS_CLIENT_PROTOCOL = "wishwe.v1"


@database_sync_to_async
def get_user_from_token(raw_token):
    try:
        token = AccessToken(raw_token)
        return get_user_model().objects.get(pk=token["user_id"])
    except (TokenError, KeyError, get_user_model().DoesNotExist):
        return None


@database_sync_to_async
def get_user_from_ticket(encoded_ticket):
    try:
        padding = "=" * (-len(encoded_ticket) % 4)
        ticket = base64.urlsafe_b64decode(
            encoded_ticket + padding
        ).decode("ascii")
        payload = signing.loads(
            ticket,
            salt="wishwe.websocket-auth",
            max_age=60,
        )
    except (
        binascii.Error,
        ValueError,
        UnicodeDecodeError,
        signing.BadSignature,
    ):
        return None

    if not isinstance(payload, dict):
        return None

    if payload.get("purpose") != "websocket":
        return None

    user_id = payload.get("user_id")
    if not isinstance(user_id, int):
        return None

    return get_user_model().objects.filter(pk=user_id).first()


class CookieJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        subprotocols = scope.get("subprotocols", [])
        ticket_protocol = next(
            (
                protocol
                for protocol in subprotocols
                if protocol.startswith(WS_TICKET_PROTOCOL_PREFIX)
            ),
            None,
        )

        if ticket_protocol:
            encoded_ticket = ticket_protocol[
                len(WS_TICKET_PROTOCOL_PREFIX):
            ]
            user = await get_user_from_ticket(encoded_ticket)
        else:
            headers = dict(scope.get("headers", []))
            raw_cookie = headers.get(b"cookie", b"").decode("latin1")
            cookies = SimpleCookie()
            cookies.load(raw_cookie)
            morsel = cookies.get("access_token")
            user = await get_user_from_token(morsel.value) if morsel else None

        safe_subprotocols = [
            protocol
            for protocol in subprotocols
            if protocol == WS_CLIENT_PROTOCOL
        ]
        return await super().__call__(
            {
                **scope,
                "user": user,
                "subprotocols": safe_subprotocols,
            },
            receive,
            send,
        )
