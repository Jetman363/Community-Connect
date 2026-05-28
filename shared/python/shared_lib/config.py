from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseServiceSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "dev"
    log_level: str = "INFO"


@lru_cache
def get_base_settings() -> BaseServiceSettings:
    return BaseServiceSettings()
