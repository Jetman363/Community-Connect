from prometheus_client import Counter, Histogram

ALERTS_INGESTED = Counter("alert_engine_alerts_ingested_total", "Total alerts ingested", ["source_system", "threat_level"])
ALERTS_PROCESSED = Counter("alert_engine_alerts_processed_total", "Total alerts processed", ["status"])
INTEGRATION_EVENTS_CONSUMED = Counter("alert_engine_integration_events_consumed_total", "Integration bridge events consumed")
PROCESSING_LATENCY = Histogram("alert_engine_processing_seconds", "Alert processing latency")
WEBSOCKET_CONNECTIONS = Counter("alert_engine_websocket_connections_total", "WebSocket connections", ["status"])
