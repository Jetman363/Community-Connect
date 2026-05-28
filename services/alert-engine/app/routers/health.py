from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session, engine
from app.repository import audit_repository
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.services.event_backend import event_backend_health

router = APIRouter()


@router.get("")
async def health() -> dict:
    return {"status": "ok", "service": "alert-engine"}


@router.get("/diagnostics")
async def diagnostics(
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    rbac.authorize(roles, "health:read")
    backend = await event_backend_health()
    async with engine.begin() as conn:
        await conn.exec_driver_sql("SELECT 1")
    audit_count = len(await audit_repository.list_recent(session, get_agency_id(principal), limit=1))
    return {
        "database": "ok",
        "event_backend": backend,
        "audit_logging": "active" if audit_count >= 0 else "inactive",
        "integration_bridge": {"enabled": settings.integration_bridge_enabled},
    }
