"""Logging setup: console output plus an optional batching OpenObserve handler."""

import contextlib
import logging
import threading
import traceback
from datetime import UTC, datetime
from typing import Any

import httpx2

from app.core.config import Settings

_BATCH_COUNT = 20
_BATCH_INTERVAL_SECONDS = 5.0
_REQUEST_TIMEOUT_SECONDS = 5.0
_MANAGED_HANDLER_ATTR = "_py_service_managed"
_UVICORN_LOGGER_NAMES = ("uvicorn", "uvicorn.error", "uvicorn.access")
# httpx2 logs each request as "httpx2"/"httpcore2.*"; without this, the client used to ship a
# batch would log its own POST, which loops back into the buffer and gets sent again, forever.
_OWN_TRANSPORT_LOGGER_PREFIXES = ("httpx2", "httpcore2", "httpcore")


class _SkipOwnTransportFilter(logging.Filter):
    """Drops records from the HTTP client this handler uses to ship its own batches."""

    def filter(self, record: logging.LogRecord) -> bool:
        return not record.name.startswith(_OWN_TRANSPORT_LOGGER_PREFIXES)


class OpenObserveHandler(logging.Handler):
    """Buffers log records and POSTs them to OpenObserve's `_json` ingest endpoint in batches.

    Records are flushed once 20 are buffered, or every 5 seconds, always from a daemon
    background thread so `emit()` never blocks the caller on a network call. A failed send is
    swallowed: it never raises and never blocks the caller.
    """

    def __init__(
        self,
        url: str,
        org: str,
        stream: str,
        user: str | None = None,
        password: str | None = None,
    ) -> None:
        super().__init__()
        self.addFilter(_SkipOwnTransportFilter())
        self._endpoint = f"{url.rstrip('/')}/api/{org}/{stream}/_json"
        auth = httpx2.BasicAuth(user, password or "") if user else None
        self._client = httpx2.Client(auth=auth, timeout=_REQUEST_TIMEOUT_SECONDS)
        self._buffer: list[dict[str, Any]] = []
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._flush_now = threading.Event()
        self._thread = threading.Thread(
            target=self._run,
            name="openobserve-log-flush",
            daemon=True,
        )
        self._thread.start()

    def emit(self, record: logging.LogRecord) -> None:
        """Buffer the record as a JSON dict; wake the background thread once the batch is full."""
        try:
            entry = self._to_entry(record)
            with self._lock:
                self._buffer.append(entry)
                should_flush = len(self._buffer) >= _BATCH_COUNT
            if should_flush:
                self._flush_now.set()
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        """Stop the background thread and send whatever is left in the buffer."""
        self._stop_event.set()
        self._flush_now.set()
        self._thread.join(timeout=_BATCH_INTERVAL_SECONDS)
        self._flush()
        self._client.close()
        super().close()

    def _run(self) -> None:
        while not self._stop_event.is_set():
            self._flush_now.wait(_BATCH_INTERVAL_SECONDS)
            self._flush_now.clear()
            self._flush()

    def _flush(self) -> None:
        with self._lock:
            if not self._buffer:
                return
            batch, self._buffer = self._buffer, []
        # A send failure must never crash the app or block the request path, and it must not
        # be logged through this same handler, or a persistent outage would loop forever.
        with contextlib.suppress(Exception):
            self._client.post(self._endpoint, json=batch)

    @staticmethod
    def _to_entry(record: logging.LogRecord) -> dict[str, Any]:
        entry: dict[str, Any] = {
            "_timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info:
            entry["exc_info"] = "".join(traceback.format_exception(*record.exc_info))
        return entry


def _remove_managed_handlers(logger: logging.Logger) -> None:
    """Remove and close handlers a previous `setup_logging` call added to `logger`."""
    for handler in list(logger.handlers):
        if getattr(handler, _MANAGED_HANDLER_ATTR, False):
            logger.removeHandler(handler)
            handler.close()


def setup_logging(settings: Settings) -> OpenObserveHandler | None:
    """Configure console (and, when set, OpenObserve) logging. Safe to call more than once.

    Uvicorn's own loggers (`uvicorn`, `uvicorn.error`, `uvicorn.access`) are pointed at the
    root logger's handlers instead of their own, so every log line goes through the same
    console/OpenObserve setup with no duplicates.

    Returns the `OpenObserveHandler` so the caller can flush and close it on shutdown, or
    `None` when no OpenObserve URL is configured.
    """
    root = logging.getLogger()
    _remove_managed_handlers(root)
    root.setLevel(settings.log_level)

    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    console_handler.setFormatter(console_formatter)
    setattr(console_handler, _MANAGED_HANDLER_ATTR, True)
    root.addHandler(console_handler)

    openobserve_handler: OpenObserveHandler | None = None
    if settings.openobserve_url:
        password = (
            settings.openobserve_password.get_secret_value()
            if settings.openobserve_password
            else None
        )
        openobserve_handler = OpenObserveHandler(
            url=settings.openobserve_url,
            org=settings.openobserve_org,
            stream=settings.openobserve_stream,
            user=settings.openobserve_user,
            password=password,
        )
        setattr(openobserve_handler, _MANAGED_HANDLER_ATTR, True)
        root.addHandler(openobserve_handler)

    for name in _UVICORN_LOGGER_NAMES:
        uvicorn_logger = logging.getLogger(name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True

    return openobserve_handler
