from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = "cad-dispatch-service"
    host: str = "0.0.0.0"
    port: int = 8070
    cad_db_url: str = "postgresql+asyncpg://bluecore:bluecore@localhost:5432/cad_db"
    redis_url: str = "redis://localhost:6379/2"
    event_stream_prefix: str = "bluecore.cad"
    websocket_gateway_url: str = "http://localhost:8061"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    run_migrations_on_startup: bool = True


settings = Settings()
