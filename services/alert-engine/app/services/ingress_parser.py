import logging

from app.schemas import UnifiedEvent
from app.services.integration_adapter import integration_event_adapter
from app.services.normalization import normalization_service

logger = logging.getLogger(__name__)


def parse_ingress_message(data: dict) -> UnifiedEvent | None:
    """Decode alert ingress payloads from API ingest or integration bridge."""
    if not data:
        return None
    if integration_event_adapter.is_integration_envelope(data):
        return normalization_service.from_integration_event(data["event"])
    if data.get("message_type") == "integration.normalized" and "event" in data:
        return normalization_service.from_integration_event(data["event"])
    try:
        return UnifiedEvent.model_validate(data)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Unparseable ingress message: %s", exc)
        return None
