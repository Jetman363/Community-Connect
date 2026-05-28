from typing import Any

import httpx

from app.connectors.base import BaseConnector, ConnectorHealthStatus, HealthReport, NormalizedEvent


class FlockSafetyConnector(BaseConnector):
    connector_type = "flock_safety"
    display_name = "Flock Safety"
    supported_auth = ["api_key", "oauth2"]
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        token = self.resolve_bearer_token()
        if not token:
            raise ValueError("Flock Safety API key or OAuth token required")
        base_url = self.config.get("base_url", "https://api.flocksafety.com")
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{base_url}/v1/health", headers={"Authorization": f"Bearer {token}"})
        if resp.status_code >= 400:
            raise ValueError(f"Flock authentication failed: {resp.status_code}")
        return {"authenticated": True, "provider": "flock_safety"}

    async def normalize_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> list[NormalizedEvent]:
        _ = headers
        event_type = payload.get("type", "plate_read")
        return [
            NormalizedEvent(
                source="flock_safety",
                event_type=f"flock.{event_type}",
                agency_id=self.agency_id,
                connector_id=self.connector_id,
                occurred_at=payload.get("timestamp", ""),
                external_id=payload.get("id"),
                payload={
                    "plate": payload.get("plate"),
                    "camera_id": payload.get("camera_id"),
                    "location": payload.get("location"),
                    "confidence": payload.get("confidence"),
                    "image_url": payload.get("image_url"),
                },
                metadata={"raw_type": event_type},
            )
        ]

    async def poll(self) -> list[NormalizedEvent]:
        base_url = self.config.get("base_url", "https://api.flocksafety.com")
        since = self.config.get("poll_since")
        headers = self.auth_bearer_headers()

        async def _fetch() -> list[dict[str, Any]]:
            params = {"since": since} if since else {}
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{base_url}/v1/reads", headers=headers, params=params)
                resp.raise_for_status()
                return resp.json().get("reads", [])

        reads = await self.with_retry("flock_poll", _fetch)
        events: list[NormalizedEvent] = []
        for read in reads:
            events.extend(await self.normalize_webhook(read, {}))
        return events

    async def health_check(self) -> HealthReport:
        try:
            await self.authenticate()
            return HealthReport(status=ConnectorHealthStatus.HEALTHY, message="Flock Safety API reachable")
        except Exception as exc:  # noqa: BLE001
            return HealthReport(
                status=ConnectorHealthStatus.UNHEALTHY,
                message=str(exc),
                details={"connector_type": self.connector_type},
            )
