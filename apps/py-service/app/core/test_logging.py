"""Tests for the OpenObserve logging handler and `setup_logging`."""

import contextlib
import logging
import threading
from collections.abc import Callable, Iterator
from typing import Any

import httpx2
import pytest

from app.core.config import Settings
from app.core.logging import OpenObserveHandler, setup_logging

_UVICORN_LOGGER_NAMES = ("uvicorn", "uvicorn.error", "uvicorn.access")


class _FakeClient:
    """Stands in for `httpx2.Client`. Records every post attempt; never touches the network."""

    def __init__(
        self, *, auth: httpx2.BasicAuth | None = None, timeout: float | None = None
    ) -> None:
        self.auth = auth
        self.timeout = timeout
        self.posts: list[tuple[str, list[dict[str, Any]]]] = []
        self.thread_names: list[str] = []
        self.attempts = 0
        self.attempted_event = threading.Event()
        self.post_event = threading.Event()
        self.closed = False
        self.raise_on_post: Exception | None = None

    def post(self, url: str, *, json: list[dict[str, Any]]) -> None:
        self.thread_names.append(threading.current_thread().name)
        self.attempts += 1
        self.attempted_event.set()
        if self.raise_on_post is not None:
            raise self.raise_on_post
        self.posts.append((url, json))
        self.post_event.set()

    def close(self) -> None:
        self.closed = True


@pytest.fixture
def fake_clients(monkeypatch: pytest.MonkeyPatch) -> list[_FakeClient]:
    """Patch `httpx2.Client` in the logging module so no handler ever hits the network."""
    created: list[_FakeClient] = []

    def _factory(
        *, auth: httpx2.BasicAuth | None = None, timeout: float | None = None
    ) -> _FakeClient:
        client = _FakeClient(auth=auth, timeout=timeout)
        created.append(client)
        return client

    monkeypatch.setattr("app.core.logging.httpx2.Client", _factory)
    return created


@pytest.fixture
def handler_factory(
    fake_clients: list[_FakeClient],
) -> Iterator[Callable[..., OpenObserveHandler]]:
    handlers: list[OpenObserveHandler] = []

    def _make(
        url: str = "http://openobserve.local",
        org: str = "default",
        stream: str = "py-service",
        user: str | None = None,
        password: str | None = None,
    ) -> OpenObserveHandler:
        handler = OpenObserveHandler(url=url, org=org, stream=stream, user=user, password=password)
        handlers.append(handler)
        return handler

    yield _make

    for handler in handlers:
        with contextlib.suppress(Exception):
            handler.close()


@pytest.fixture(autouse=True)
def _restore_root_logging() -> Iterator[None]:
    """Snapshot root/uvicorn logger state and put it back, closing any handler left behind."""
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


def _logger_with_handler(
    handler: OpenObserveHandler, name: str = "py-service-test-logger"
) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.handlers = [handler]
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    return logger


def _settings(**overrides: Any) -> Settings:
    defaults: dict[str, Any] = {
        "app_env": "development",
        "log_level": "INFO",
        "openobserve_url": None,
        "openobserve_org": "default",
        "openobserve_stream": "py-service",
        "openobserve_user": None,
        "openobserve_password": None,
    }
    defaults.update(overrides)
    return Settings(_env_file=None, **defaults)


# --- OpenObserveHandler --------------------------------------------------------------------


def test_emit_batches_20_records_into_one_post_with_expected_keys(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory(url="http://openobserve.local/", org="default", stream="py-service")
    logger = _logger_with_handler(handler)

    for i in range(19):
        logger.info("message %d", i)
    fake_client = fake_clients[0]
    assert fake_client.posts == []

    logger.info("message 19")
    assert fake_client.post_event.wait(timeout=2.0)
    handler.close()

    assert len(fake_client.posts) == 1
    url, batch = fake_client.posts[0]
    assert url == "http://openobserve.local/api/default/py-service/_json"
    assert len(batch) == 20
    assert set(batch[0].keys()) == {"_timestamp", "level", "message", "logger"}


def test_endpoint_url_without_trailing_slash_is_not_doubled(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory(url="http://openobserve.local")
    logger = _logger_with_handler(handler)

    for _ in range(20):
        logger.info("message")
    assert fake_clients[0].post_event.wait(timeout=2.0)
    handler.close()

    url, _batch = fake_clients[0].posts[0]
    assert url == "http://openobserve.local/api/default/py-service/_json"


def test_client_created_with_basic_auth_when_user_given(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    login = "admin@example.com"
    raw_value = "s3cret"
    handler_factory(user=login, password=raw_value)

    assert isinstance(fake_clients[0].auth, httpx2.BasicAuth)


def test_client_created_without_auth_when_no_user_given(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler_factory()

    assert fake_clients[0].auth is None


def test_close_flushes_buffered_records_below_batch_size(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()
    logger = _logger_with_handler(handler)

    for i in range(5):
        logger.info("message %d", i)
    handler.close()

    fake_client = fake_clients[0]
    assert len(fake_client.posts) == 1
    assert len(fake_client.posts[0][1]) == 5


def test_close_with_empty_buffer_does_not_post(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()

    handler.close()

    assert fake_clients[0].posts == []


def test_emit_includes_exc_info_text_for_exception_logging(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()
    logger = _logger_with_handler(handler)

    try:
        raise ValueError("boom")
    except ValueError:
        logger.exception("failed")
    handler.close()

    entry = fake_clients[0].posts[0][1][0]
    assert "ValueError" in entry["exc_info"]
    assert "boom" in entry["exc_info"]


def test_post_failure_is_swallowed_and_does_not_raise(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()
    fake_clients[0].raise_on_post = ConnectionError("boom")
    logger = _logger_with_handler(handler)

    for _ in range(20):
        logger.info("message")
    assert fake_clients[0].attempted_event.wait(timeout=2.0)

    handler.close()

    assert fake_clients[0].attempts >= 1
    assert fake_clients[0].posts == []


def test_handle_drops_records_from_own_transport_loggers(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()
    httpx2_record = logging.LogRecord(
        "httpx2", logging.INFO, __file__, 1, "sent request", None, None
    )
    httpcore_record = logging.LogRecord(
        "httpcore2.connection", logging.DEBUG, __file__, 1, "connect", None, None
    )

    handler.handle(httpx2_record)
    handler.handle(httpcore_record)
    handler.close()

    assert fake_clients[0].posts == []


def test_emit_does_not_post_on_the_caller_thread(
    fake_clients: list[_FakeClient], handler_factory: Callable[..., OpenObserveHandler]
) -> None:
    handler = handler_factory()
    logger = _logger_with_handler(handler)

    for _ in range(20):
        logger.info("message")
    assert fake_clients[0].post_event.wait(timeout=2.0)
    handler.close()

    assert fake_clients[0].thread_names == ["openobserve-log-flush"]


# --- setup_logging ---------------------------------------------------------------------------


def test_setup_logging_without_url_returns_none_and_no_openobserve_handler(
    fake_clients: list[_FakeClient],
) -> None:
    settings = _settings(openobserve_url=None)

    handler = setup_logging(settings)

    assert handler is None
    root = logging.getLogger()
    assert not any(isinstance(h, OpenObserveHandler) for h in root.handlers)
    assert fake_clients == []


def test_setup_logging_with_url_returns_handler_attached_once(
    fake_clients: list[_FakeClient],
) -> None:
    settings = _settings(openobserve_url="http://openobserve.local")

    handler = setup_logging(settings)

    root = logging.getLogger()
    assert isinstance(handler, OpenObserveHandler)
    assert [h for h in root.handlers if isinstance(h, OpenObserveHandler)] == [handler]


def test_setup_logging_called_twice_replaces_handler_without_duplicates(
    fake_clients: list[_FakeClient],
) -> None:
    settings = _settings(openobserve_url="http://openobserve.local")
    root = logging.getLogger()
    baseline_handlers = list(root.handlers)

    first_handler = setup_logging(settings)
    second_handler = setup_logging(settings)

    openobserve_handlers = [h for h in root.handlers if isinstance(h, OpenObserveHandler)]
    # Excludes pytest's own log-capture handlers (also `StreamHandler`s) already on the root
    # logger before this test ran, so only the console handler `setup_logging` owns is counted.
    console_handlers = [
        h
        for h in root.handlers
        if h not in baseline_handlers
        and isinstance(h, logging.StreamHandler)
        and not isinstance(h, OpenObserveHandler)
    ]
    assert openobserve_handlers == [second_handler]
    assert len(console_handlers) == 1
    assert first_handler is not None
    assert first_handler is not second_handler
    assert fake_clients[0].closed is True


def test_setup_logging_clears_uvicorn_logger_handlers_and_enables_propagate(
    fake_clients: list[_FakeClient],
) -> None:
    settings = _settings(openobserve_url=None)
    for name in _UVICORN_LOGGER_NAMES:
        logging.getLogger(name).addHandler(logging.NullHandler())
        logging.getLogger(name).propagate = False

    setup_logging(settings)

    for name in _UVICORN_LOGGER_NAMES:
        logger = logging.getLogger(name)
        assert logger.handlers == []
        assert logger.propagate is True


@pytest.mark.parametrize("log_level", ["DEBUG", "WARNING"])
def test_setup_logging_sets_root_level_from_settings(
    fake_clients: list[_FakeClient], log_level: str
) -> None:
    settings = _settings(log_level=log_level, openobserve_url=None)

    setup_logging(settings)

    assert logging.getLogger().level == getattr(logging, log_level)
