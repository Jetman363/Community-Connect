"""
Example WebSocket adapter for real-time CAD event streams.

Subscribes to external CAD WebSocket feed and forwards events to BlueCore
cad-dispatch-service and websocket-gateway.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx
import websockets

logger = logging.getLogger(__name__)

EVENT_MAP = {
    "CALL_NEW": "incident.created",
    "CALL_UPDATE": "incident.updated",
    "UNIT_STATUS": "unit.status",
    "UNIT_ASSIGN": "unit.assigned",
    "UNIT_EMERGENCY": "unit.emergency",
}


class ExternalCadWebSocketAdapter:
    def __init__(
        self,
        ws_url: str,
        auth_token: str,
        websocket_gateway_url: str = "http://websocket-gateway:8061",
        agency_id: str = "agency-demo-001",
    ) -> None:
        self.ws_url = ws_url
        self.auth_token = auth_token
        self.websocket_gateway_url = websocket_gateway_url
        self.agency_id = agency_id

    async def handle_message(self, raw: str) -> None:
        data = json.loads(raw)
        external_type = data.get("eventType", "")
        platform_type = EVENT_MAP.get(external_type)
        if not platform_type:
            return
        envelope = {
            "type": platform_type,
            "agency_id": self.agency_id,
            "source": "external-cad-ws",
            **data.get("payload", {}),
        }
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"{self.websocket_gateway_url}/internal/broadcast", json=envelope)
        logger.info("Forwarded %s → %s", external_type, platform_type)

    async def listen(self) -> None:
        uri = f"{self.ws_url}?token={self.auth_token}"
        async with websockets.connect(uri) as ws:
            logger.info("Connected to external CAD WebSocket")
            async for message in ws:
                try:
                    await self.handle_message(message)
                except Exception:  # noqa: BLE001
                    logger.exception("Failed to process CAD WS message")


async def main() -> None:
    adapter = ExternalCadWebSocketAdapter(
        ws_url="wss://cad.example.gov/events",
        auth_token="your-token",
    )
    await adapter.listen()


if __name__ == "__main__":
    asyncio.run(main())
