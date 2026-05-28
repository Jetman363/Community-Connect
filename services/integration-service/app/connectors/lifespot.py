from typing import Any

import httpx

from app.connectors.base import BaseConnector, ConnectorHealthStatus, HealthReport, NormalizedEvent


class LifeSpotConnector(BaseConnector):
    connector_type = "lifespot"
    display_name = "LifeSpot"
    supported_auth = ["api_key", "oauth2"]
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        headers = self.auth_api_key_header()
        if not headers:
            headers = self.auth_bearer_headers()
        if not headers:
            raise ValueError("LifeSpot API key or OAuth token required")
        base_url = self.config.get("base_url", "https://api.lifespotapp.com")
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{base_url}/v1/status", headers=headers)
        if resp.status_code >= 400:
            raise ValueError(f"LifeSpot authentication failed: {resp.status_code}")
        return {"authenticated": True, "provider": "lifespot"}

    async def normalize_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> list[NormalizedEvent]:
        _ = headers
        alert_type = payload.get("alert_type", "officer_down")
        return [
            NormalizedEvent(
                source="lifespot",
                event_type=f"lifespot.{alert_type}",
                agency_id=self.agency_id,
                connector_id=self.connector_id,
                occurred_at=payload.get("triggered_at", ""),
                external_id=payload.get("alert_id"),
                payload={
                    "officer_id": payload.get("officer_id"),
                    "officer_name": payload.get("officer_name"),
                    "location": payload.get("location"),
                    "latitude": payload.get("lat"),
                    "longitude": payload.get("lng"),
                    "alert_type": alert_type,
                    "status": payload.get("status"),
                },
                metadata={"priority": "critical" if alert_type == "officer_down" else "high"},
            )
        ]

    async def poll(self) -> list[NormalizedEvent]:
        base_url = self.config.get("base_url", "https://api.lifespotapp.com")
        headers = self.auth_api_key_header() or self.auth_bearer_headers()

        async def _fetch() -> list[dict[str, Any]]:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{base_url}/v1/alerts/active", headers=headers)
                resp.raise_for_status()
                return resp.json().get("alerts", [])

        alerts = await self.with_retry("lifespot_poll", _fetch)
        events: list[NormalizedEvent] = []
        for alert in alerts:
            events.extend(await self.normalize_webhook(alert, {}))
        return events

    async def health_check(self) -> HealthReport:
        try:
            await self.authenticate()
            return HealthReport(status=ConnectorHealthStatus.HEALTHY, message="LifeSpot API reachable")
        except Exception as exc:  # noqa: BLE001
            return HealthReport(status=ConnectorHealthStatus.UNHEALTHY, message=str(exc))
