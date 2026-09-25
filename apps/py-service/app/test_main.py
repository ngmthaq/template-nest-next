"""Tests for the FastAPI app: Swagger routes in dev vs production, and shutdown handling."""

import contextlib
import logging
from collections.abc import Iterator
from typing import Any

import httpx2
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app

_UVICORN_LOGGER_NAMES = ("uvicorn", "uvicorn.error", "uvicorn.access")


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _restore_root_logging() -> Iterator[None]:
    """`create_app` mutates the root/uvicorn loggers; restore the previous state after each test."""
    root = logging.getLogger()
    original_root_handlers = list(root.handlers)
    original_root_level = root.level
    original_uvicorn = {
        name: (list(logging.getLogger(name).handlers), logging.getLogger(name).propagate)
        for name in _UVICORN_LOGGER_NAMES
    }

    yield

    for handler in root.handlers:
        if handler not in original_root_handlers:
            with contextlib.suppress(Exception):
                handler.close()
    root.handlers = original_root_handlers
    root.setLevel(original_root_level)
    for name, (handlers, propagate) in original_uvicorn.items():
        logger = logging.getLogger(name)
        logger.handlers = handlers
        logger.propagate = propagate


@pytest.fixture
def dev_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("OPENOBSERVE_URL", raising=False)
    get_settings.cache_clear()
    with TestClient(create_app()) as client:
        yield client


@pytest.fixture
def prod_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("OPENOBSERVE_URL", raising=False)
    get_settings.cache_clear()
    with TestClient(create_app()) as client:
        yield client


def test_swagger_ui_returns_200_outside_production(dev_client: TestClient) -> None:
    response = dev_client.get("/swagger")

    assert response.status_code == 200


def test_swagger_json_returns_200_with_title_outside_production(dev_client: TestClient) -> None:
    response = dev_client.get("/swagger-json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "py-service"


def test_docs_route_returns_404_outside_production(dev_client: TestClient) -> None:
    response = dev_client.get("/docs")

    assert response.status_code == 404


def test_redoc_route_returns_404_outside_production(dev_client: TestClient) -> None:
    response = dev_client.get("/redoc")

    assert response.status_code == 404


def test_swagger_ui_returns_404_in_production(prod_client: TestClient) -> None:
    response = prod_client.get("/swagger")

    assert response.status_code == 404


def test_swagger_json_returns_404_in_production(prod_client: TestClient) -> None:
    response = prod_client.get("/swagger-json")

    assert response.status_code == 404


def test_health_still_returns_200_in_production(prod_client: TestClient) -> None:
    response = prod_client.get("/health")

    assert response.status_code == 200


class _FakeClient:
    """Minimal `httpx2.Client` stand-in; only `close()` matters for the shutdown test."""

    def __init__(
        self, *, auth: httpx2.BasicAuth | None = None, timeout: float | None = None
    ) -> None:
        self.closed = False

    def post(self, url: str, *, json: list[dict[str, Any]]) -> None:
        return None

    def close(self) -> None:
        self.closed = True


def test_lifespan_shutdown_closes_openobserve_handler(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_clients: list[_FakeClient] = []

    def _factory(
        *, auth: httpx2.BasicAuth | None = None, timeout: float | None = None
    ) -> _FakeClient:
        client = _FakeClient(auth=auth, timeout=timeout)
        fake_clients.append(client)
        return client

    monkeypatch.setattr("app.core.logging.httpx2.Client", _factory)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("OPENOBSERVE_URL", "http://openobserve.local")
    get_settings.cache_clear()

    with TestClient(create_app()):
        assert fake_clients[0].closed is False

    assert fake_clients[0].closed is True
