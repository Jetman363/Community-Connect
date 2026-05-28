from collections import defaultdict
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.schemas import UnifiedEvent


class AICorrelationEngine:
    """Framework for multi-source event linking and pattern detection."""

    def __init__(self) -> None:
        self._entity_index: dict[str, list[str]] = defaultdict(list)
        self._location_index: dict[str, list[str]] = defaultdict(list)
        self._recent_events: list[tuple[datetime, UnifiedEvent]] = []
        self._window = timedelta(hours=24)

    def correlate(self, event: UnifiedEvent) -> UnifiedEvent:
        correlation_id = event.correlation_id or str(uuid4())
        event.correlation_id = correlation_id

        links: list[dict] = []
        links.extend(self._link_entities(event))
        links.extend(self._link_locations(event))
        links.extend(self._temporal_correlations(event))

        event.ai_enrichment = {
            **event.ai_enrichment,
            "correlation_id": correlation_id,
            "linked_events": links,
            "patterns": self._detect_patterns(event),
            "rag_context_ready": True,
        }
        self._index_event(event)
        return event

    def _link_entities(self, event: UnifiedEvent) -> list[dict]:
        links: list[dict] = []
        for entity in event.entities:
            key = self._entity_key(entity)
            if not key:
                continue
            prior = [eid for eid in self._entity_index.get(key, []) if eid != event.event_id]
            if prior:
                links.append({"type": "entity", "entity": entity, "related_event_ids": prior[:5]})
        return links

    def _link_locations(self, event: UnifiedEvent) -> list[dict]:
        if not event.geolocation:
            return []
        key = self._location_key(event.geolocation)
        prior = [eid for eid in self._location_index.get(key, []) if eid != event.event_id]
        if prior:
            return [{"type": "geospatial", "grid": key, "related_event_ids": prior[:5]}]
        return []

    def _temporal_correlations(self, event: UnifiedEvent) -> list[dict]:
        cutoff = event.timestamp - self._window
        related: list[str] = []
        for ts, prior in self._recent_events:
            if ts < cutoff:
                continue
            if prior.agency_id != event.agency_id:
                continue
            if prior.event_id == event.event_id:
                continue
            if abs((event.timestamp - ts).total_seconds()) <= 3600:
                related.append(prior.event_id)
        if related:
            return [{"type": "temporal", "window_hours": 1, "related_event_ids": related[:10]}]
        return []

    def _detect_patterns(self, event: UnifiedEvent) -> list[str]:
        patterns: list[str] = []
        if any(e.get("type") == "vehicle" for e in event.entities):
            patterns.append("vehicle_activity")
        if event.event_type.startswith("officer."):
            patterns.append("officer_safety")
        if event.raw_payload.get("bolo_match"):
            patterns.append("bolo_hit")
        repeat_loc = len(self._location_index.get(self._location_key(event.geolocation or {}), []))
        if repeat_loc >= 3:
            patterns.append("repeat_location")
        return patterns

    def _index_event(self, event: UnifiedEvent) -> None:
        self._recent_events.append((event.timestamp, event))
        cutoff = datetime.now(timezone.utc) - self._window
        self._recent_events = [(ts, e) for ts, e in self._recent_events if ts >= cutoff]
        for entity in event.entities:
            key = self._entity_key(entity)
            if key:
                self._entity_index[key].append(event.event_id)
        if event.geolocation:
            self._location_index[self._location_key(event.geolocation)].append(event.event_id)

    @staticmethod
    def _entity_key(entity: dict) -> str | None:
        etype = entity.get("type")
        if etype == "vehicle" and entity.get("plate"):
            return f"vehicle:{entity['plate'].upper()}"
        if etype == "person" and entity.get("id"):
            return f"person:{entity['id']}"
        if etype == "officer" and entity.get("id"):
            return f"officer:{entity['id']}"
        return None

    @staticmethod
    def _location_key(geo: dict) -> str:
        lat = round(float(geo.get("lat", 0)), 2)
        lon = round(float(geo.get("lon", 0)), 2)
        return f"{lat}:{lon}"


correlation_engine = AICorrelationEngine()
