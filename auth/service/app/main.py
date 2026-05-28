from fastapi import FastAPI
from app.routers import admin, auth, outbox, users
from app.models import Base
from app.db import engine
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest


def create_app() -> FastAPI:
    app = FastAPI(
        title="Auth Service",
        version="0.1.0",
        description="CJIS-aligned identity, session, and user management service.",
    )
    app.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
    app.include_router(users.router, prefix="/v1/users", tags=["users"])
    app.include_router(admin.router, prefix="/v1/admin", tags=["admin"])
    app.include_router(outbox.router, prefix="/v1/outbox", tags=["outbox"])

    @app.get("/metrics", tags=["observability"])
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {"status": "ok", "service": "auth-service"}

    @app.get("/readyz", tags=["health"])
    async def readyz() -> dict:
        async with engine.begin() as conn:
            await conn.exec_driver_sql("SELECT 1")
        return {"status": "ready", "service": "auth-service"}

    @app.on_event("startup")
    async def on_startup() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    return app


app = create_app()
