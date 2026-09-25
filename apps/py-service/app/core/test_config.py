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


def test_settings_defaults_log_level_to_info() -> None:
    settings = Settings(_env_file=None)

    assert settings.log_level == "INFO"


def test_settings_defaults_openobserve_url_to_none() -> None:
    settings = Settings(_env_file=None)

    assert settings.openobserve_url is None


def test_settings_defaults_openobserve_org_to_default() -> None:
    settings = Settings(_env_file=None)

    assert settings.openobserve_org == "default"


def test_settings_defaults_openobserve_stream_to_py_service() -> None:
    settings = Settings(_env_file=None)

    assert settings.openobserve_stream == "py-service"


def test_settings_defaults_openobserve_user_to_none() -> None:
    settings = Settings(_env_file=None)

    assert settings.openobserve_user is None


def test_settings_defaults_openobserve_password_to_none() -> None:
    settings = Settings(_env_file=None)

    assert settings.openobserve_password is None


def test_settings_reads_log_level_override_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")

    settings = Settings(_env_file=None)

    assert settings.log_level == "DEBUG"


def test_settings_reads_openobserve_url_override_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENOBSERVE_URL", "http://openobserve.local")

    settings = Settings(_env_file=None)

    assert settings.openobserve_url == "http://openobserve.local"


def test_settings_reads_openobserve_stream_override_from_env(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OPENOBSERVE_STREAM", "custom-stream")

    settings = Settings(_env_file=None)

    assert settings.openobserve_stream == "custom-stream"


def test_settings_openobserve_password_is_secret_and_hidden_in_repr(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    raw_value = "hunter2"
    monkeypatch.setenv("OPENOBSERVE_PASSWORD", raw_value)

    settings = Settings(_env_file=None)

    assert settings.openobserve_password is not None
    assert settings.openobserve_password.get_secret_value() == raw_value
    assert raw_value not in repr(settings.openobserve_password)
