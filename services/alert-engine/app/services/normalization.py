from datetime import datetime, timezone
from uuid import uuid4

from app.connectors.base import RawFeedEvent
from app.schemas import IngestEventRequest, UnifiedEvent


class EventNormalizationService:
    """Normalize heterogeneous feed events into the unified BlueCore alert schema."""

    def from_raw_feed(self, agency_id: str, feed: RawFeedEvent, correlation_id: str | None = None) -> UnifiedEvent:
        geolocation = self._extract_geolocation(feed.payload)
        entities = self._extract_entities(feed.payload, feed.event_type)
        return UnifiedEvent(
            event_id=str(uuid4()),
            agency_id=agency_id,
            source_system=feed.source_system,
            event_type=feed.event_type,
            severity=self._infer_severity(feed.event_type, feed.payload),
            timestamp=self._parse_timestamp(feed.timestamp),
            geolocation=geolocation,
            entities=entities,
            raw_payload=feed.payload,
            normalized_payload=self._normalize_payload(feed),
            ai_enrichment={},
            correlation_id=correlation_id,
        )

    def from_integration_event(self, integration_event: dict, correlation_id: str | None = None) -> UnifiedEvent:
        from app.services.integration_adapter import integration_event_adapter

        fields = integration_event_adapter.to_unified_fields(integration_event)
        fields["correlation_id"] = correlation_id
        return UnifiedEvent(**fields)

    def from_api_request(self, request: IngestEventRequest, correlation_id: str | None = None) -> UnifiedEvent:
        ts = request.timestamp or datetime.now(timezone.utc)
        geolocation = request.geolocation or self._extract_geolocation(request.payload)
        entities = request.entities or self._extract_entities(request.payload, request.event_type)
        return UnifiedEvent(
            event_id=str(uuid4()),
            agency_id=request.agency_id,
            source_system=request.source_system,
            event_type=request.event_type,
            severity=request.severity,
            timestamp=ts,
            geolocation=geolocation,
            entities=entities,
            raw_payload=request.payload,
            normalized_payload=self._normalize_api_payload(request),
            ai_enrichment={},
            correlation_id=correlation_id,
        )

    def _normalize_payload(self, feed: RawFeedEvent) -> dict:
        base = {
            "source": feed.source_system,
            "type": feed.event_type,
            "summary": feed.payload.get("summary") or feed.payload.get("description"),
        }
        if feed.payload.get("plate"):
            base["license_plate"] = feed.payload["plate"]
        if feed.payload.get("officer_id"):
            base["officer_id"] = feed.payload["officer_id"]
        if feed.payload.get("location"):
            base["location"] = feed.payload["location"]
        return base

    def _normalize_api_payload(self, request: IngestEventRequest) -> dict:
        return {
            "source": request.source_system,
            "type": request.event_type,
            "summary": request.payload.get("summary") or request.payload.get("description"),
            **{k: v for k, v in request.payload.items() if k not in ("summary", "description")},
        }

    def _extract_geolocation(self, payload: dict) -> dict | None:
        if payload.get("geolocation"):
            return payload["geolocation"]
        lat = payload.get("lat") or payload.get("latitude")
        lon = payload.get("lng") or payload.get("lon") or payload.get("longitude")
        if lat is not None and lon is not None:
            return {"lat": float(lat), "lon": float(lon), "type": "Point"}
        location = payload.get("location")
        if isinstance(location, dict) and location.get("lat") and location.get("lon"):
            return {"lat": float(location["lat"]), "lon": float(location["lon"]), "type": "Point"}
        return None

    def _extract_entities(self, payload: dict, event_type: str) -> list[dict]:
        entities: list[dict] = []
        if payload.get("plate"):
            entities.append({"type": "vehicle", "plate": payload["plate"]})
        if payload.get("officer_id"):
            entities.append({"type": "officer", "id": payload["officer_id"]})
        if payload.get("person_id"):
            entities.append({"type": "person", "id": payload["person_id"]})
        if "bolo" in event_type or payload.get("bolo_match"):
            entities.append({"type": "bolo", "matched": True})
        return entities

    def _infer_severity(self, event_type: str, payload: dict) -> str:
        if "officer_emergency" in event_type or "officer.emergency" in event_type:
            return "critical"
        if payload.get("bolo_match"):
            return "high"
        if "lpr.hit" in event_type:
            return "medium"
        return payload.get("severity", "info")

    def _parse_timestamp(self, value: str) -> datetime:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(timezone.utc)


normalization_service = EventNormalizationService()
