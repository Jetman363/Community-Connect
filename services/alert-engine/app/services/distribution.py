import json
import logging
from typing import Any

import httpx
from redis.asyncio import Redis

from app.models import Alert, AlertSubscription
from app.schemas import AlertResponse, ThreatLevel
from app.services.event_backend import get_event_backend
from app.settings import settings

logger = logging.getLogger(__name__)

THREAT_ORDER = [ThreatLevel.LOW, ThreatLevel.MEDIUM, ThreatLevel.HIGH, ThreatLevel.CRITICAL]


class AlertDistributionService:
    """Broadcast alerts via WebSocket gateway, SSE fanout, and notification hooks."""

    BROADCAST_CHANNEL = f"{settings.event_stream_prefix}.broadcast"

    async def publish_alert(self, alert: Alert) -> None:
        payload = self._alert_payload(alert)
        backend = get_event_backend()
        await backend.publish(settings.kafka_processed_topic, payload)
        await backend.publish(self.BROADCAST_CHANNEL, payload)
        await self._redis_publish(payload)
        await self._notify_gateway(payload)

    async def route_to_subscribers(self, alert: Alert, subscriptions: list[AlertSubscription]) -> list[str]:
        delivered: list[str] = []
        for sub in subscriptions:
            if not self._matches_subscription(alert, sub):
                continue
            for channel in sub.channels or ["websocket"]:
                await self._deliver_channel(channel, sub.user_id, alert)
            delivered.append(sub.user_id)
        return delivered

    async def _deliver_channel(self, channel: str, user_id: str, alert: Alert) -> None:
        payload = self._alert_payload(alert)
        if channel == "websocket":
            await self._redis_publish({**payload, "target_user_id": user_id})
        elif channel == "email":
            await self._hook("email", user_id, payload)
        elif channel == "sms":
            await self._hook("sms", user_id, payload)
        elif channel == "mobile":
            await self._hook("mobile", user_id, payload)

    async def _redis_publish(self, payload: dict[str, Any]) -> None:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        try:
            await client.publish(f"{settings.event_stream_prefix}.live", json.dumps(payload))
        finally:
            await client.aclose()

    async def _notify_gateway(self, payload: dict[str, Any]) -> None:
        url = f"{settings.websocket_gateway_url.rstrip('/')}/internal/broadcast"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.post(url, json=payload)
        except Exception as exc:  # noqa: BLE001
            logger.debug("WebSocket gateway broadcast skipped: %s", exc)

    async def _hook(self, hook_type: str, user_id: str, payload: dict[str, Any]) -> None:
        logger.info("Notification hook", extra={"hook": hook_type, "user_id": user_id, "alert_id": payload.get("id")})

    def _matches_subscription(self, alert: Alert, sub: AlertSubscription) -> bool:
        if sub.event_types and alert.event_type not in sub.event_types:
            return False
        try:
            min_level = ThreatLevel(sub.min_threat_level)
            alert_level = ThreatLevel(alert.threat_level)
            if THREAT_ORDER.index(alert_level) < THREAT_ORDER.index(min_level):
                return False
        except ValueError:
            pass
        if sub.geofence and alert.geolocation:
            from app.services.threat_engine import ThreatPrioritizationEngine

            if not ThreatPrioritizationEngine._point_in_geofence(alert.geolocation, sub.geofence):
                return False
        return True

    @staticmethod
    def _alert_payload(alert: Alert) -> dict[str, Any]:
        return AlertResponse(
            id=alert.id,
            agency_id=alert.agency_id,
            source_system=alert.source_system,
            event_type=alert.event_type,
            severity=alert.severity,
            threat_level=alert.threat_level,
            title=alert.title,
            summary=alert.summary,
            correlation_id=alert.correlation_id,
            officer_safety=alert.officer_safety,
            geolocation=alert.geolocation,
            entities=alert.entities or [],
            normalized_payload=alert.normalized_payload or {},
            ai_enrichment=alert.ai_enrichment or {},
            threat_score=alert.threat_score,
            status=alert.status,
            escalated=alert.escalated,
            created_at=alert.created_at,
        ).model_dump(mode="json")


distribution_service = AlertDistributionService()
