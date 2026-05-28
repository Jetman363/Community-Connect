from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.graphql_schema import graphql_app
from app.middleware.rate_limit import AdminRateLimitMiddleware
from app.routers import admin_proxy, alerts, auth_proxy, cad_proxy, call_parser_proxy, health, incident_reports_proxy, proxy
from app.settings import settings


def create_app() -> FastAPI:
    app = FastAPI(title="BlueCore API Gateway", version="0.2.0")
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(AdminRateLimitMiddleware)
    app.include_router(health.router, prefix="/v1")
    app.include_router(auth_proxy.router, prefix="/v1/auth", tags=["auth"])
    app.include_router(admin_proxy.router, prefix="/v1")
    app.include_router(proxy.router, prefix="/v1", tags=["proxy"])
    app.include_router(incident_reports_proxy.router, prefix="/v1")
    app.include_router(alerts.router, prefix="/v1/alerts", tags=["alerts"])
    app.include_router(cad_proxy.router, prefix="/v1")
    app.include_router(call_parser_proxy.router, prefix="/v1")
    app.mount("/graphql", graphql_app)
    return app


app = create_app()
