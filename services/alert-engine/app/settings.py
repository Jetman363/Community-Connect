from pydantic_settings import BaseSettings, SettingsConfigDict


class AlertEngineSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    alert_engine_host: str = "0.0.0.0"
    alert_engine_port: int = 8060
    alert_db_url: str = "sqlite+aiosqlite:///./alert_engine.db"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    redis_url: str = "redis://redis:6379/1"
    event_backend: str = "kafka"
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_client_id: str = "alert-engine"
    kafka_ingress_topic: str = "bluecore.alerts.ingress"
    kafka_processed_topic: str = "bluecore.alerts.processed"
    kafka_consumer_group: str = "alert-engine-processors"
    event_stream_prefix: str = "bluecore.alerts"
    credential_encryption_key: str = "dev-32-byte-key-change-in-prod!!"
    opensearch_url: str = ""
    opensearch_index: str = "bluecore-alerts"
    neo4j_uri: str = ""
    neo4j_user: str = ""
    neo4j_password: str = ""
    rate_limit_per_minute: int = 600
    max_retry_attempts: int = 5
    consumer_worker_enabled: bool = True
    poll_worker_enabled: bool = True
    run_alembic_on_startup: bool = True
    websocket_heartbeat_seconds: int = 30
    sse_poll_interval_ms: int = 1000
    websocket_gateway_url: str = "http://websocket-gateway:8061"
    kafka_security_protocol: str = "PLAINTEXT"
    kafka_sasl_mechanism: str = ""
    kafka_sasl_username: str = ""
    kafka_sasl_password: str = ""
    kafka_ssl_cafile: str = ""
    kafka_auto_create_topics: bool = True
    kafka_topic_partitions: int = 3
    kafka_replication_factor: int = 1
    kafka_producer_acks: str = "all"
    kafka_compression_type: str = "gzip"
    kafka_enable_idempotence: bool = True
    kafka_producer_linger_ms: int = 5
    kafka_producer_max_batch_size: int = 16384
    kafka_read_timeout_ms: int = 1000
    alert_bridge_secret: str = "dev-bridge-secret-change-me"
    integration_bridge_enabled: bool = True


settings = AlertEngineSettings()
