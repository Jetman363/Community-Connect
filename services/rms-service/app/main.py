from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.db import engine
from app.models import Base
from app.routers import incident_reports, incidents, outbox, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="BlueCore RMS Service",
        version="0.3.0",
        description="Records management — incidents, structured reports, CJIS audit, and outbox events.",
        lifespan=lifespan,
    )
    app.include_router(incidents.router, prefix="/v1/incidents", tags=["incidents"])
    app.include_router(reports.router, prefix="/v1/reports", tags=["reports"])
    app.include_router(incident_reports.router, prefix="/v1/incident-reports", tags=["incident-reports"])
    app.include_router(outbox.router, prefix="/v1/outbox", tags=["outbox"])

    @app.get("/metrics", tags=["observability"])
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {"status": "ok", "service": "rms-service"}

    @app.get("/readyz", tags=["health"])
    async def readyz() -> dict:
        async with engine.begin() as conn:
            await conn.exec_driver_sql("SELECT 1")
        return {"status": "ready", "service": "rms-service"}

    return app


app = create_app()
