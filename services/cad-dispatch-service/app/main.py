from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db import Base, engine
from app.routers import calls, health, incidents, ncic, units
from app.seed import seed_demo_data
from app.settings import settings


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with engine.begin() as conn:
        count = await conn.scalar(text("SELECT COUNT(*) FROM units"))
        if count == 0:
            await seed_demo_data()
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="BlueCore CAD Dispatch Service",
        version="1.0.0",
        description="Real-time CAD dispatch, unit tracking, and incident management for law enforcement MDT.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix="/v1")
    app.include_router(incidents.router, prefix="/v1")
    app.include_router(units.router, prefix="/v1")
    app.include_router(calls.router, prefix="/v1")
    app.include_router(ncic.router, prefix="/v1")
    return app


app = create_app()
