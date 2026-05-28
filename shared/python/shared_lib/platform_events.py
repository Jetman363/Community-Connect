"""Cross-service platform event contracts for BlueCore."""

from typing import Any

# Kafka / Redis stream topics
INTEGRATION_STREAM_PREFIX = "bluecore.integrations"
ALERT_INGRESS_TOPIC = "bluecore.alerts.ingress"
ALERT_PROCESSED_TOPIC = "bluecore.alerts.processed"
PLATFORM_INTEGRATION_TOPIC = "bluecore.platform.integration.events"
ALERT_LIVE_REDIS_CHANNEL_SUFFIX = ".live"

# Message types on alert ingress
MSG_INTEGRATION_NORMALIZED = "integration.normalized"
MSG_UNIFIED_EVENT = "alert.unified"


def integration_bridge_envelope(normalized_event: dict[str, Any]) -> dict[str, Any]:
    """Wrap an integration NormalizedEvent for alert-engine ingress."""
    return {
        "message_type": MSG_INTEGRATION_NORMALIZED,
        "event": normalized_event,
    }
