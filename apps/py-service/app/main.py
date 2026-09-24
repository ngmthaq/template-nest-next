"""FastAPI application entry point."""

from fastapi import FastAPI

from app.feature.health.router import router as health_router


def create_app() -> FastAPI:
    """Build the FastAPI app and register its routers."""
    app = FastAPI()
    app.include_router(health_router)
    return app


app = create_app()
