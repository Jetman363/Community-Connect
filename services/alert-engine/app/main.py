from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.db import engine
from app.observability.logging import configure_logging
from app.routers import alerts, audit, connectors, health, ingestion, rules, search, stream, webhooks
from app.security.middleware import RateLimitMiddleware
from app.services.consumer_worker import consumer_worker
from app.services.db_migrate import run_migrations
from app.services.event_backend import event_backend_health, start_event_backend, stop_event_backend
from app.services.polling_worker import polling_worker
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    if settings.run_alembic_on_startup:
        run_migrations()
    await start_event_backend()
    if settings.consumer_worker_enabled:
        await consumer_worker.start()
    if settings.poll_worker_enabled:
        await polling_worker.start()
    yield
    await polling_worker.stop()
    await consumer_worker.stop()
    await stop_event_backend()


def create_app() -> FastAPI:
    app = FastAPI(
        title="BlueCore Real-Time Alert Engine",
        version="1.0.0",
        description=(
            "Enterprise real-time alert ingestion, correlation, threat prioritization, "
            "and distribution for law enforcement operations."
        ),
        lifespan=lifespan,
    )
    app.add_middleware(RateLimitMiddleware)

    app.include_router(alerts.router, prefix="/v1/alerts", tags=["alerts"])
    app.include_router(ingestion.router, prefix="/v1/ingest", tags=["ingestion"])
    app.include_router(webhooks.router, prefix="/v1/webhooks", tags=["webhooks"])
    app.include_router(connectors.router, prefix="/v1", tags=["connectors"])
    app.include_router(rules.router, prefix="/v1/rules", tags=["rules"])
    app.include_router(search.router, prefix="/v1/analytics", tags=["analytics"])
    app.include_router(audit.router, prefix="/v1/audit", tags=["audit"])
    app.include_router(health.router, prefix="/v1/health", tags=["health"])
    app.include_router(stream.router, prefix="/v1/stream", tags=["streaming"])

    @app.get("/metrics", tags=["observability"])
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {
            "status": "ok",
            "service": "alert-engine",
            "event_backend": settings.event_backend,
            "integration_bridge": settings.integration_bridge_enabled,
        }

    @app.get("/readyz", tags=["health"])
    async def readyz() -> dict:
        async with engine.begin() as conn:
            await conn.exec_driver_sql("SELECT 1")
        backend_health = await event_backend_health()
        if backend_health.get("status") != "ok":
            raise HTTPException(status_code=503, detail={"event_backend": backend_health})
        return {"status": "ready", "service": "alert-engine", "event_backend": backend_health}

    return app


app = create_app()
