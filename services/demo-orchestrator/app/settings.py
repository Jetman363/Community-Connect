from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8090
    agency_id: str = "agency-demo-001"
    cad_dispatch_url: str = "http://localhost:8070/v1"
    rms_service_url: str = "http://localhost:8010/v1"
    websocket_gateway_url: str = "http://localhost:8061"
    redis_url: str = "redis://localhost:6379/3"
    event_stream_prefix: str = "bluecore.demo"
    demo_mode_enabled: bool = True


settings = Settings()
