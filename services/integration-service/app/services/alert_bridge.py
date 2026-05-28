import logging
from typing import Any

import httpx

from app.services.event_backend import get_event_backend
from app.settings import settings
from shared_lib.platform_events import ALERT_INGRESS_TOPIC, integration_bridge_envelope

logger = logging.getLogger(__name__)


class AlertBridgeService:
    """Forward normalized integration events to the Real-Time Alert Engine."""

    async def forward_events(self, events: list[dict[str, Any]]) -> int:
        if not settings.alert_bridge_enabled or not events:
            return 0

        forwarded = 0
        backend = get_event_backend()
        topic = settings.kafka_alert_ingress_topic or ALERT_INGRESS_TOPIC

        for event in events:
            envelope = integration_bridge_envelope(event)
            try:
                await backend.publish(topic, envelope)
                forwarded += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Kafka alert bridge failed, trying HTTP: %s", exc)
                if await self._http_forward(event):
                    forwarded += 1
        if forwarded:
            logger.info("Forwarded %d events to alert engine", forwarded)
        return forwarded

    async def _http_forward(self, event: dict[str, Any]) -> bool:
        if not settings.alert_engine_url:
            return False
        url = f"{settings.alert_engine_url.rstrip('/')}/v1/ingest/integration"
        headers = {"X-Bridge-Secret": settings.alert_bridge_secret}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, json={"event": event}, headers=headers)
                return resp.status_code < 400
        except Exception as exc:  # noqa: BLE001
            logger.warning("HTTP alert bridge failed: %s", exc)
            return False

    async def health(self) -> dict[str, Any]:
        return {
            "enabled": settings.alert_bridge_enabled,
            "kafka_topic": settings.kafka_alert_ingress_topic or ALERT_INGRESS_TOPIC,
            "alert_engine_url": settings.alert_engine_url or None,
        }


alert_bridge_service = AlertBridgeService()
