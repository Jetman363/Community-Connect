import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.connectors.registry import connector_registry
from app.security.encryption import CredentialEncryptionService


@pytest.mark.asyncio
async def test_service_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        assert resp.json()["service"] == "integration-service"


def test_connector_registry_lists_builtins():
    types = {c["connector_type"] for c in connector_registry.list_types()}
    assert "flock_safety" in types
    assert "lifespot" in types
    assert "generic_cad" in types
    assert "generic_osint" in types


def test_credential_encryption_roundtrip():
    svc = CredentialEncryptionService(secret="test-key-for-unit-tests-only!!")
    encrypted = svc.encrypt("super-secret-api-key")
    assert svc.decrypt(encrypted) == "super-secret-api-key"


@pytest.mark.asyncio
async def test_flock_normalize_webhook():
    connector = connector_registry.instantiate(
        "flock_safety", "conn-1", "metro-pd", {}, {"api_key": "test"}
    )
    events = await connector.normalize_webhook(
        {"type": "plate_read", "id": "evt-1", "plate": "ABC123", "timestamp": "2026-05-27T12:00:00Z"},
        {},
    )
    assert len(events) == 1
    assert events[0].event_type == "flock.plate_read"
    assert events[0].payload["plate"] == "ABC123"
