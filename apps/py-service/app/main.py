"""FastAPI application entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.logging import OpenObserveHandler, setup_logging
from app.feature.health.router import router as health_router

_APP_TITLE = "py-service"
_APP_DESCRIPTION = "A small FastAPI microservice."
_APP_VERSION = "0.0.1"


def create_app() -> FastAPI:
    """Build the FastAPI app and register its routers."""
    settings = get_settings()
    openobserve_handler: OpenObserveHandler | None = setup_logging(settings)
    is_production = settings.app_env == "production"

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        try:
            yield
        finally:
            if openobserve_handler is not None:
                openobserve_handler.close()

    app = FastAPI(
        title=_APP_TITLE,
        description=_APP_DESCRIPTION,
        version=_APP_VERSION,
        docs_url=None if is_production else "/swagger",
        openapi_url=None if is_production else "/swagger-json",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.include_router(health_router)
    return app


app = create_app()
