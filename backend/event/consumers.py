from channels.generic.websocket import AsyncJsonWebsocketConsumer

from event.realtime import EVENT_FEED_GROUP


class EventFeedConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(
            EVENT_FEED_GROUP,
            self.channel_name,
        )
        subprotocol = (
            "wishwe.v1"
            if "wishwe.v1" in self.scope.get("subprotocols", [])
            else None
        )
        await self.accept(subprotocol=subprotocol)

    async def disconnect(self, close_code):
        if self.scope.get("user") and self.scope["user"].is_authenticated:
            await self.channel_layer.group_discard(
                EVENT_FEED_GROUP,
                self.channel_name,
            )

    async def feed_changed(self, event):
        await self.send_json({"type": "feed.changed"})
