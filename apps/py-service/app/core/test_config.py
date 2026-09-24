"""Tests for application settings."""

from collections.abc import Iterator

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_settings_defaults_app_env_to_development() -> None:
    settings = Settings(_env_file=None)

    assert settings.app_env == "development"


def test_settings_defaults_port_to_8000() -> None:
    settings = Settings(_env_file=None)

    assert settings.port == 8000


def test_settings_reads_port_override_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "9000")

    settings = Settings(_env_file=None)

    assert settings.port == 9000


def test_settings_reads_app_env_override_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")

    settings = Settings(_env_file=None)

    assert settings.app_env == "production"


def test_settings_rejects_non_integer_port(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "not-a-number")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_get_settings_returns_same_cached_instance() -> None:
    first = get_settings()
    second = get_settings()

    assert first is second
