from pydantic_settings import BaseSettings, SettingsConfigDict


class IntegrationSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    integration_host: str = "0.0.0.0"
    integration_port: int = 8050
    integration_db_url: str = "sqlite+aiosqlite:///./integration.db"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    credential_encryption_key: str = "dev-32-byte-key-change-in-prod!!"
    redis_url: str = "redis://redis:6379/0"
    event_stream_prefix: str = "bluecore.integrations"
    webhook_base_url: str = "http://localhost:8050"
    audit_service_url: str = "http://audit-service:8030"
    max_retry_attempts: int = 5
    poll_interval_seconds: int = 60
    poll_worker_enabled: bool = True
    run_alembic_on_startup: bool = True
    event_backend: str = "redis"

    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_client_id: str = "integration-service"
    kafka_topic_partitions: int = 1
    kafka_replication_factor: int = 1
    kafka_auto_create_topics: bool = True
    kafka_producer_acks: str = "all"
    kafka_compression_type: str = "gzip"
    kafka_enable_idempotence: bool = True
    kafka_producer_linger_ms: int = 5
    kafka_producer_max_batch_size: int = 16384
    kafka_read_timeout_ms: int = 1000
    kafka_security_protocol: str = "PLAINTEXT"
    kafka_sasl_mechanism: str = ""
    kafka_sasl_username: str = ""
    kafka_sasl_password: str = ""
    kafka_ssl_cafile: str = ""

    alert_bridge_enabled: bool = True
    alert_engine_url: str = "http://alert-engine:8060"
    kafka_alert_ingress_topic: str = "bluecore.alerts.ingress"
    alert_bridge_secret: str = "dev-bridge-secret-change-me"


settings = IntegrationSettings()
