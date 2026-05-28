from pydantic_settings import BaseSettings, SettingsConfigDict


class RmsSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    rms_host: str = "0.0.0.0"
    rms_port: int = 8010
    rms_db_url: str = "sqlite+aiosqlite:///./rms.db"
    cji_encryption_key: str = "bluecore-cji-dev-key-change-in-prod"


settings = RmsSettings()
