from typing import Any

from app.connectors.base import BaseAlertConnector, RawFeedEvent


class FlockSafetyAlertConnector(BaseAlertConnector):
    connector_type = "flock_safety"
    display_name = "Flock Safety LPR"
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        if not self.credentials.get("api_key") and not self.credentials.get("access_token"):
            raise ValueError("Flock credentials required")
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        return [
            RawFeedEvent(
                source_system="flock_safety",
                event_type="lpr.hit",
                payload={
                    "plate": payload.get("plate"),
                    "camera_id": payload.get("camera_id"),
                    "location": payload.get("location"),
                    "confidence": payload.get("confidence"),
                    "bolo_match": payload.get("bolo_match", False),
                },
                timestamp=payload.get("timestamp", RawFeedEvent.__dataclass_fields__["timestamp"].default_factory()),
            )
        ]


class LifeSpotAlertConnector(BaseAlertConnector):
    connector_type = "lifespot"
    display_name = "LifeSpot Officer Safety"
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        if not self.credentials.get("api_key"):
            raise ValueError("LifeSpot API key required")
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        alert_type = payload.get("alert_type", "officer_emergency")
        return [
            RawFeedEvent(
                source_system="lifespot",
                event_type=f"officer.{alert_type}",
                payload={
                    "officer_id": payload.get("officer_id"),
                    "location": payload.get("location"),
                    "lat": payload.get("lat"),
                    "lng": payload.get("lng"),
                },
                timestamp=payload.get("triggered_at", RawFeedEvent.__dataclass_fields__["timestamp"].default_factory()),
            )
        ]


class GenericCADAlertConnector(BaseAlertConnector):
    connector_type = "generic_cad"
    display_name = "Generic CAD"
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        incident = payload.get("incident", payload)
        return [
            RawFeedEvent(
                source_system="generic_cad",
                event_type=f"cad.{incident.get('status', 'dispatch')}",
                payload=incident,
                timestamp=incident.get("reported_at", RawFeedEvent.__dataclass_fields__["timestamp"].default_factory()),
            )
        ]


class GenericOSINTAlertConnector(BaseAlertConnector):
    connector_type = "generic_osint"
    display_name = "Generic OSINT"
    supports_webhook = True
    supports_polling = True

    async def authenticate(self) -> dict[str, Any]:
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        return [
            RawFeedEvent(
                source_system="generic_osint",
                event_type=f"osint.{payload.get('feed_type', 'intel')}",
                payload=payload,
                timestamp=payload.get("published_at", RawFeedEvent.__dataclass_fields__["timestamp"].default_factory()),
            )
        ]


class RMSAlertConnector(BaseAlertConnector):
    connector_type = "rms_alerts"
    display_name = "RMS Alerts"
    supports_webhook = True

    async def authenticate(self) -> dict[str, Any]:
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        return [
            RawFeedEvent(
                source_system="rms_alerts",
                event_type=payload.get("alert_type", "rms.alert"),
                payload=payload,
            )
        ]


class GenericCameraAlertConnector(BaseAlertConnector):
    connector_type = "generic_camera"
    display_name = "Generic Camera System"
    supports_webhook = True
    supports_stream = True

    async def authenticate(self) -> dict[str, Any]:
        return {"ok": True}

    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        _ = headers
        return [
            RawFeedEvent(
                source_system="generic_camera",
                event_type=payload.get("event_type", "camera.motion"),
                payload=payload,
            )
        ]
