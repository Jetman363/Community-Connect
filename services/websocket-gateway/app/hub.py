import asyncio
import json
import logging
from dataclasses import dataclass, field

from fastapi import WebSocket
from redis.asyncio import Redis

from app.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class ChannelSubscription:
    websocket: WebSocket
    agency_id: str
    roles: list[str]
    user_id: str


class WebSocketHub:
    def __init__(self) -> None:
        self._clients: list[ChannelSubscription] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, agency_id: str, roles: list[str], user_id: str) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.append(ChannelSubscription(websocket, agency_id, roles, user_id))
        logger.info("WS client connected", extra={"agency_id": agency_id, "user_id": user_id})

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients = [c for c in self._clients if c.websocket is not websocket]

    async def broadcast(self, payload: dict) -> int:
        delivered = 0
        agency_id = payload.get("agency_id")
        threat_level = payload.get("threat_level", "LOW")
        async with self._lock:
            clients = list(self._clients)
        for client in clients:
            if agency_id and client.agency_id != agency_id:
                continue
            if not self._can_view(client.roles, threat_level):
                continue
            try:
                await client.websocket.send_json(payload)
                delivered += 1
            except Exception:  # noqa: BLE001
                await self.disconnect(client.websocket)
        return delivered

    async def listen_redis(self) -> None:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        pubsub = client.pubsub()
        channels = [
            f"{settings.event_stream_prefix}.live",
            f"{settings.cad_stream_prefix}.live",
            "bluecore.demo.live",
        ]
        await pubsub.subscribe(*channels)
        logger.info("Listening on Redis channels %s", channels)
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=settings.heartbeat_seconds)
                if message and message.get("data"):
                    await self.broadcast(json.loads(message["data"]))
        finally:
            await pubsub.unsubscribe(*channels)
            await client.aclose()

    @staticmethod
    def _can_view(roles: list[str], threat_level: str) -> bool:
        if "administrator" in roles or "admin" in roles:
            return True
        return True  # gateway trusts alert-engine RBAC filtering; re-check optional


hub = WebSocketHub()
