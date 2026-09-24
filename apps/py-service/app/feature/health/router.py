"""Health check endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResult(BaseModel):
    """Response body for the health check."""

    status: str


@router.get("/health", response_model=HealthResult)
async def check_health() -> HealthResult:
    """Liveness/readiness probe."""
    return HealthResult(status="ok")
