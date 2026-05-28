import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.kafka_backend import KafkaBackend


def test_resolve_start_offset():
    assert KafkaBackend._resolve_start_offset("0") == 1  # noqa: SLF001
    assert KafkaBackend._resolve_start_offset("41") == 42  # noqa: SLF001
    assert KafkaBackend._resolve_start_offset("bad") == 0  # noqa: SLF001


def test_parse_record():
    payload = {"envelope": {"topic": "t"}, "signature": "abc"}
    raw = json.dumps(payload).encode("utf-8")
    assert KafkaBackend._parse_record(raw) == payload  # noqa: SLF001
    assert KafkaBackend._parse_record(None) == {}  # noqa: SLF001
    assert KafkaBackend._parse_record(b"not-json") == {"raw": "not-json"}  # noqa: SLF001


@pytest.mark.asyncio
async def test_kafka_publish_calls_producer():
    backend = KafkaBackend()
    mock_producer = AsyncMock()
    mock_producer.send_and_wait = AsyncMock(return_value=MagicMock(partition=0, offset=7))
    backend._producer = mock_producer
    backend._started = True
    backend.ensure_topic = AsyncMock()

    await backend.publish("bluecore.integrations.agency-a.events", {"envelope": {}, "signature": "sig"})

    backend.ensure_topic.assert_awaited_once_with("bluecore.integrations.agency-a.events")
    mock_producer.send_and_wait.assert_awaited_once()
    args, kwargs = mock_producer.send_and_wait.call_args
    assert args[0] == "bluecore.integrations.agency-a.events"
    assert json.loads(kwargs["value"].decode("utf-8"))["signature"] == "sig"


@pytest.mark.asyncio
async def test_get_event_backend_selects_kafka(monkeypatch):
    monkeypatch.setenv("EVENT_BACKEND", "kafka")
    from app.settings import IntegrationSettings
    from app.services import event_backend as eb_module

    eb_module._backend_instance = None
    cfg = IntegrationSettings(event_backend="kafka")
    monkeypatch.setattr("app.services.event_backend.settings", cfg)

    backend = eb_module.get_event_backend()
    assert backend.__class__.__name__ == "KafkaBackend"
    eb_module._backend_instance = None
