from typing import Any

import httpx

from app.connectors.base import BaseConnector, ConnectorHealthStatus, HealthReport, NormalizedEvent


class GenericCADConnector(BaseConnector):
    connector_type = "generic_cad"
    display_name = "Generic CAD API"
    supported_auth = ["api_key", "oauth2", "basic"]
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        base_url = self.config.get("base_url")
        if not base_url:
            raise ValueError("CAD base_url required in config")
        headers = self.resolve_auth_headers()
        if not headers:
            raise ValueError("CAD credentials required")
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"{base_url}/health", headers=headers)
        if resp.status_code >= 400:
            raise ValueError(f"CAD authentication failed: {resp.status_code}")
        return {"authenticated": True, "provider": "generic_cad"}

    async def normalize_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> list[NormalizedEvent]:
        _ = headers
        incident = payload.get("incident", payload)
        return [
            NormalizedEvent(
                source="generic_cad",
                event_type=f"cad.{incident.get('status', 'incident_update')}",
                agency_id=self.agency_id,
                connector_id=self.connector_id,
                occurred_at=incident.get("reported_at", ""),
                external_id=incident.get("incident_id"),
                payload={
                    "incident_id": incident.get("incident_id"),
                    "call_type": incident.get("call_type"),
                    "priority": incident.get("priority"),
                    "location": incident.get("location"),
                    "assigned_units": incident.get("assigned_units", []),
                    "status": incident.get("status"),
                    "narrative": incident.get("narrative"),
                },
            )
        ]

    async def poll(self) -> list[NormalizedEvent]:
        base_url = self.config.get("base_url", "")
        since = self.config.get("poll_since")
        headers = self.resolve_auth_headers()

        async def _fetch() -> list[dict[str, Any]]:
            params = {"since": since} if since else {}
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(f"{base_url}/incidents/active", headers=headers, params=params)
                resp.raise_for_status()
                return resp.json().get("incidents", [])

        incidents = await self.with_retry("cad_poll", _fetch)
        events: list[NormalizedEvent] = []
        for inc in incidents:
            events.extend(await self.normalize_webhook({"incident": inc}, {}))
        return events

    async def health_check(self) -> HealthReport:
        try:
            await self.authenticate()
            return HealthReport(status=ConnectorHealthStatus.HEALTHY, message="CAD API reachable")
        except Exception as exc:  # noqa: BLE001
            return HealthReport(status=ConnectorHealthStatus.DEGRADED, message=str(exc))
