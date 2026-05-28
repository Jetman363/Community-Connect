import json
import os
from typing import Any

from app.services.alert_bridge import alert_bridge_service
from app.services.event_backend import get_event_backend
from app.settings import settings


class EventQueueService:
    def __init__(self) -> None:
        self._backend = get_event_backend()
        self._prefix = settings.event_stream_prefix

    def _stream_name(self, agency_id: str) -> str:
        return f"{self._prefix}.{agency_id}.events"

    async def publish_events(self, agency_id: str, events: list[dict[str, Any]]) -> int:
        if not events:
            return 0
        stream = self._stream_name(agency_id)
        count = 0
        for event in events:
            envelope = {
                "topic": stream,
                "timestamp": event.get("occurred_at"),
                "payload": event,
            }
            signature = self._sign(envelope)
            await self._backend.publish(stream, {"envelope": envelope, "signature": signature})
            count += 1
        if settings.alert_bridge_enabled:
            await alert_bridge_service.forward_events(events)
        return count

    async def read_stream(self, agency_id: str, count: int = 20, last_id: str = "0") -> list[dict[str, Any]]:
        return await self._backend.read(self._stream_name(agency_id), last_id, count)

    def _sign(self, envelope: dict[str, Any]) -> str:
        import hashlib
        import hmac

        secret = os.getenv("EVENT_SIGNING_SECRET", settings.credential_encryption_key)
        canonical = json.dumps(envelope, sort_keys=True, separators=(",", ":"))
        return hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()


event_queue_service = EventQueueService()
