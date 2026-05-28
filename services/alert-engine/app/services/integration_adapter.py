from datetime import datetime, timezone
from uuid import uuid4

from shared_lib.platform_events import MSG_INTEGRATION_NORMALIZED


class IntegrationEventAdapter:
    """Map Integration Management Service NormalizedEvent → alert UnifiedEvent fields."""

    EVENT_TYPE_MAP = {
        "flock.plate_read": "lpr.hit",
        "flock.read": "lpr.hit",
        "lifespot.officer_down": "officer.emergency",
        "lifespot.officer_emergency": "officer.emergency",
        "lifespot.panic": "officer.panic",
        "cad.dispatch": "cad.dispatch",
        "cad.incident": "cad.dispatch",
        "osint.intel": "osint.intel",
        "rms.alert": "rms.alert",
    }

    SOURCE_PREFIX_MAP = {
        "flock": "flock_safety",
        "lifespot": "lifespot",
        "cad": "generic_cad",
        "osint": "generic_osint",
        "rms": "rms_alerts",
    }

    def to_unified_fields(self, integration_event: dict) -> dict:
        source = integration_event.get("source", "integration")
        raw_type = integration_event.get("event_type", "unknown")
        event_type = self._map_event_type(raw_type, source)
        payload = dict(integration_event.get("payload") or {})
        metadata = integration_event.get("metadata") or {}

        if metadata.get("priority") == "critical":
            payload.setdefault("severity", "critical")
        if "officer" in raw_type or "lifespot" in source:
            payload.setdefault("severity", "critical")

        connector_id = integration_event.get("connector_id", "")
        external_id = integration_event.get("external_id")
        event_id = f"int:{connector_id}:{external_id}" if external_id else str(uuid4())

        return {
            "event_id": event_id,
            "agency_id": integration_event.get("agency_id", ""),
            "source_system": self._map_source(source),
            "event_type": event_type,
            "severity": self._infer_severity(event_type, payload, metadata),
            "timestamp": self._parse_timestamp(integration_event.get("occurred_at")),
            "geolocation": self._extract_geolocation(payload),
            "entities": self._extract_entities(payload, event_type, metadata),
            "raw_payload": {
                **payload,
                "integration_event_type": raw_type,
                "connector_id": connector_id,
                "external_id": external_id,
                "integration_metadata": metadata,
            },
            "normalized_payload": {
                "source": source,
                "type": event_type,
                "summary": self._build_summary(source, event_type, payload),
                "connector_id": connector_id,
            },
            "ai_enrichment": {"origin": "integration-service", "integration_event_type": raw_type},
            "correlation_id": None,
        }

    def is_integration_envelope(self, message: dict) -> bool:
        return message.get("message_type") == MSG_INTEGRATION_NORMALIZED and "event" in message

    def _map_event_type(self, raw_type: str, source: str) -> str:
        if raw_type in self.EVENT_TYPE_MAP:
            return self.EVENT_TYPE_MAP[raw_type]
        if raw_type.startswith("flock."):
            return "lpr.hit"
        if raw_type.startswith("lifespot."):
            suffix = raw_type.split(".", 1)[-1]
            return f"officer.{suffix}"
        if raw_type.startswith("cad."):
            return raw_type.replace("cad.", "cad.", 1)
        if "." in raw_type:
            return raw_type
        return f"{source}.{raw_type}"

    def _map_source(self, source: str) -> str:
        prefix = source.split("_")[0].split(".")[0]
        return self.SOURCE_PREFIX_MAP.get(prefix, source)

    def _infer_severity(self, event_type: str, payload: dict, metadata: dict) -> str:
        if metadata.get("priority") in ("critical", "high", "medium", "low"):
            return metadata["priority"] if metadata["priority"] != "high" else "high"
        if "officer.emergency" in event_type or "officer.panic" in event_type:
            return "critical"
        if payload.get("bolo_match"):
            return "high"
        if "lpr.hit" in event_type:
            return "medium"
        return payload.get("severity", "info")

    def _extract_geolocation(self, payload: dict) -> dict | None:
        lat = payload.get("lat") or payload.get("latitude")
        lon = payload.get("lng") or payload.get("lon") or payload.get("longitude")
        if lat is not None and lon is not None:
            return {"lat": float(lat), "lon": float(lon), "type": "Point"}
        location = payload.get("location")
        if isinstance(location, dict) and location.get("lat") and location.get("lon"):
            return {"lat": float(location["lat"]), "lon": float(location["lon"]), "type": "Point"}
        return None

    def _extract_entities(self, payload: dict, event_type: str, metadata: dict) -> list[dict]:
        entities: list[dict] = []
        if payload.get("plate"):
            entities.append({"type": "vehicle", "plate": payload["plate"]})
        if payload.get("officer_id"):
            entities.append({"type": "officer", "id": payload["officer_id"]})
        if metadata.get("bolo_match") or payload.get("bolo_match"):
            entities.append({"type": "bolo", "matched": True})
        return entities

    def _build_summary(self, source: str, event_type: str, payload: dict) -> str:
        if payload.get("plate"):
            return f"{source} plate read: {payload['plate']}"
        if payload.get("officer_id"):
            return f"{source} officer alert: {payload.get('officer_name') or payload['officer_id']}"
        return payload.get("summary") or event_type.replace(".", " ").title()

    def _parse_timestamp(self, value: str | None) -> datetime:
        if not value:
            return datetime.now(timezone.utc)
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(timezone.utc)


integration_event_adapter = IntegrationEventAdapter()
