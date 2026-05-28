from pydantic_settings import BaseSettings, SettingsConfigDict


class GatewaySettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8061
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    redis_url: str = "redis://redis:6379/1"
    event_stream_prefix: str = "bluecore.alerts"
    cad_stream_prefix: str = "bluecore.cad"
    heartbeat_seconds: int = 30
    allow_demo_ws: bool = False


settings = GatewaySettings()
