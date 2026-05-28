import json
import logging
from datetime import UTC, datetime

import httpx
from redis.asyncio import Redis

from app.settings import settings

logger = logging.getLogger(__name__)


async def publish_cad_event(event_type: str, agency_id: str, payload: dict) -> None:
    envelope = {
        "type": event_type,
        "agency_id": agency_id,
        "timestamp": datetime.now(UTC).isoformat(),
        "source": settings.service_name,
        **payload,
    }
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        channel = f"{settings.event_stream_prefix}.live"
        await client.publish(channel, json.dumps(envelope))
        await client.aclose()
    except Exception:  # noqa: BLE001
        logger.exception("Failed to publish CAD event to Redis")

    try:
        async with httpx.AsyncClient(timeout=5) as http:
            await http.post(
                f"{settings.websocket_gateway_url}/internal/broadcast",
                json=envelope,
            )
    except Exception:  # noqa: BLE001
        logger.warning("WebSocket gateway broadcast unavailable", exc_info=True)
