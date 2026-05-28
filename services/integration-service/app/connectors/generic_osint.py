from typing import Any

import httpx

from app.connectors.base import BaseConnector, ConnectorHealthStatus, HealthReport, NormalizedEvent


class GenericOSINTConnector(BaseConnector):
    connector_type = "generic_osint"
    display_name = "Generic OSINT Feed"
    supported_auth = ["api_key", "oauth2"]
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        headers = self.auth_bearer_headers()
        if not headers:
            raise ValueError("OSINT API key or OAuth token required")
        base_url = self.config.get("base_url", "https://api.osint-feed.example")
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{base_url}/v1/feeds", headers=headers)
        if resp.status_code >= 400:
            raise ValueError(f"OSINT authentication failed: {resp.status_code}")
        return {"authenticated": True, "provider": "generic_osint"}

    async def normalize_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> list[NormalizedEvent]:
        _ = headers
        feed_type = payload.get("feed_type", "intel_update")
        return [
            NormalizedEvent(
                source="generic_osint",
                event_type=f"osint.{feed_type}",
                agency_id=self.agency_id,
                connector_id=self.connector_id,
                occurred_at=payload.get("published_at", ""),
                external_id=payload.get("entry_id"),
                payload={
                    "title": payload.get("title"),
                    "summary": payload.get("summary"),
                    "entities": payload.get("entities", []),
                    "threat_level": payload.get("threat_level"),
                    "source_url": payload.get("source_url"),
                    "tags": payload.get("tags", []),
                },
                metadata={"feed_type": feed_type},
            )
        ]

    async def poll(self) -> list[NormalizedEvent]:
        base_url = self.config.get("base_url", "https://api.osint-feed.example")
        feed_id = self.config.get("feed_id", "default")
        headers = self.auth_bearer_headers()

        async def _fetch() -> list[dict[str, Any]]:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{base_url}/v1/feeds/{feed_id}/entries", headers=headers)
                resp.raise_for_status()
                return resp.json().get("entries", [])

        entries = await self.with_retry("osint_poll", _fetch)
        events: list[NormalizedEvent] = []
        for entry in entries:
            events.extend(await self.normalize_webhook(entry, {}))
        return events

    async def health_check(self) -> HealthReport:
        try:
            await self.authenticate()
            return HealthReport(status=ConnectorHealthStatus.HEALTHY, message="OSINT feed reachable")
        except Exception as exc:  # noqa: BLE001
            return HealthReport(status=ConnectorHealthStatus.UNHEALTHY, message=str(exc))
