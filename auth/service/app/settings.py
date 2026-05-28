from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    auth_host: str = "0.0.0.0"
    auth_port: int = 8001
    auth_db_url: str = "sqlite+aiosqlite:///./auth.db"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_minutes: int = 1440


settings = AuthSettings()
