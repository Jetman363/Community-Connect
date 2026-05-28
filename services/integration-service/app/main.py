from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.db import engine
from app.routers import connectors, events, health, oauth, permissions, stream, webhooks
from app.services.db_migrate import run_migrations
from app.services.event_backend import event_backend_health, start_event_backend, stop_event_backend
from app.services.polling_worker import polling_worker
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.run_alembic_on_startup:
        run_migrations()
    await start_event_backend()
    if settings.poll_worker_enabled:
        await polling_worker.start()
    yield
    await polling_worker.stop()
    await stop_event_backend()


def create_app() -> FastAPI:
    app = FastAPI(
        title="BlueCore Integration Management Service",
        version="1.0.0",
        description=(
            "Enterprise integration platform for external API connectors, webhook ingestion, "
            "credential management, event routing, and connector health monitoring."
        ),
        lifespan=lifespan,
    )
    app.include_router(connectors.router, prefix="/v1/connectors", tags=["connectors"])
    app.include_router(webhooks.router, prefix="/v1/webhooks", tags=["webhooks"])
    app.include_router(health.router, prefix="/v1/health", tags=["health"])
    app.include_router(permissions.router, prefix="/v1/permissions", tags=["permissions"])
    app.include_router(events.router, prefix="/v1/events", tags=["events"])
    app.include_router(oauth.router, prefix="/v1/oauth2", tags=["oauth2"])
    app.include_router(stream.router, prefix="/v1/stream", tags=["streaming"])

    @app.get("/metrics", tags=["observability"])
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {"status": "ok", "service": "integration-service", "event_backend": settings.event_backend}

    @app.get("/readyz", tags=["health"])
    async def readyz() -> dict:
        async with engine.begin() as conn:
            await conn.exec_driver_sql("SELECT 1")
        backend_health = await event_backend_health()
        if backend_health.get("status") != "ok":
            raise HTTPException(status_code=503, detail={"event_backend": backend_health})
        return {
            "status": "ready",
            "service": "integration-service",
            "event_backend": backend_health,
        }

    return app


app = create_app()
