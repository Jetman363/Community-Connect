import pytest
from datetime import datetime, timezone

from app.schemas import IngestEventRequest, ThreatLevel, UnifiedEvent
from app.services.correlation import correlation_engine
from app.services.normalization import normalization_service
from app.services.rule_engine import rule_engine
from app.services.threat_engine import threat_engine


def test_normalization_from_api():
    req = IngestEventRequest(
        agency_id="agency-1",
        source_system="flock_safety",
        event_type="lpr.hit",
        payload={"plate": "ABC123", "lat": 33.75, "lng": -84.39},
    )
    event = normalization_service.from_api_request(req)
    assert event.agency_id == "agency-1"
    assert event.geolocation is not None
    assert any(e.get("plate") == "ABC123" for e in event.entities)


def test_threat_engine_officer_emergency():
    event = UnifiedEvent(
        event_id="e1",
        agency_id="agency-1",
        source_system="lifespot",
        event_type="officer.emergency",
        severity="critical",
        timestamp=datetime.now(timezone.utc),
        raw_payload={"officer_id": "off-1"},
    )
    result = threat_engine.evaluate(event)
    assert result.threat_level == ThreatLevel.CRITICAL
    assert result.officer_safety is True


def test_correlation_links_entities():
    event = UnifiedEvent(
        event_id="e2",
        agency_id="agency-1",
        source_system="flock_safety",
        event_type="lpr.hit",
        severity="medium",
        timestamp=datetime.now(timezone.utc),
        entities=[{"type": "vehicle", "plate": "XYZ999"}],
        raw_payload={"plate": "XYZ999"},
    )
    correlated = correlation_engine.correlate(event)
    assert correlated.correlation_id is not None
    assert correlated.ai_enrichment.get("rag_context_ready") is True


def test_rule_engine_bolo_hit():
    from app.models import RoutingRule

    event = UnifiedEvent(
        event_id="e3",
        agency_id="agency-1",
        source_system="flock_safety",
        event_type="lpr.hit",
        severity="high",
        timestamp=datetime.now(timezone.utc),
        raw_payload={"bolo_match": True},
    )
    rule = RoutingRule(
        id=1,
        agency_id="agency-1",
        name="BOLO Match",
        rule_type="bolo_hit",
        enabled=True,
        priority=10,
        conditions={},
        actions={"escalate": True},
    )
    hits = rule_engine.evaluate(event, [rule])
    assert len(hits) == 1
    assert hits[0]["rule_type"] == "bolo_hit"
