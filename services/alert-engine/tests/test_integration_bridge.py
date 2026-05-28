"""Tests for integration → alert engine event bridge."""

from app.services.integration_adapter import integration_event_adapter
from app.services.ingress_parser import parse_ingress_message
from app.services.normalization import normalization_service


FLOCK_EVENT = {
    "source": "flock_safety",
    "event_type": "flock.plate_read",
    "agency_id": "agency-1",
    "connector_id": "conn-flock-1",
    "occurred_at": "2026-05-27T14:22:00Z",
    "external_id": "read-999",
    "payload": {
        "plate": "ABC123",
        "camera_id": "cam-01",
        "location": {"lat": 33.75, "lon": -84.39},
        "confidence": 0.97,
    },
    "metadata": {},
}

LIFESPOT_EVENT = {
    "source": "lifespot",
    "event_type": "lifespot.officer_down",
    "agency_id": "agency-1",
    "connector_id": "conn-ls-1",
    "occurred_at": "2026-05-27T14:25:00Z",
    "external_id": "alert-42",
    "payload": {
        "officer_id": "off-2847",
        "lat": 33.749,
        "lng": -84.388,
    },
    "metadata": {"priority": "critical"},
}


def test_integration_adapter_maps_flock_to_lpr():
    fields = integration_event_adapter.to_unified_fields(FLOCK_EVENT)
    assert fields["event_type"] == "lpr.hit"
    assert fields["event_id"] == "int:conn-flock-1:read-999"
    assert fields["entities"][0]["plate"] == "ABC123"


def test_integration_adapter_maps_lifespot_officer_emergency():
    fields = integration_event_adapter.to_unified_fields(LIFESPOT_EVENT)
    assert fields["event_type"] == "officer.emergency"
    assert fields["severity"] == "critical"


def test_ingress_parser_handles_integration_envelope():
    envelope = {"message_type": "integration.normalized", "event": FLOCK_EVENT}
    unified = parse_ingress_message(envelope)
    assert unified is not None
    assert unified.event_type == "lpr.hit"
    assert unified.agency_id == "agency-1"


def test_normalization_from_integration_event():
    unified = normalization_service.from_integration_event(FLOCK_EVENT)
    assert unified.source_system == "flock_safety"
    assert unified.ai_enrichment.get("origin") == "integration-service"
