"""Application settings, loaded from `.env.{APP_ENV}`."""

import os
from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the service."""

    model_config = SettingsConfigDict(
        env_file=f".env.{os.environ.get('APP_ENV', 'development')}",
        extra="ignore",
    )

    app_env: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000

    log_level: str = "INFO"
    openobserve_url: str | None = None
    openobserve_org: str = "default"
    openobserve_stream: str = "py-service"
    openobserve_user: str | None = None
    openobserve_password: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    """Return the cached `Settings` instance for the process."""
    return Settings()
