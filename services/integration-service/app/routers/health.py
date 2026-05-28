from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import HealthStatusResponse
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.services.integration import connector_service
from app.services.alert_bridge import alert_bridge_service

router = APIRouter()


@router.get("/fleet")
async def fleet_health(
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> list[dict]:
    agency_id = get_agency_id(principal)
    rbac.authorize(get_roles(principal), "health:read", agency_id)
    return await connector_service.fleet_health_check(session, agency_id)


@router.get("/bridge")
async def alert_bridge_health() -> dict:
    return await alert_bridge_service.health()


@router.get("")
async def service_health() -> dict:
    bridge = await alert_bridge_service.health()
    return {"status": "ok", "service": "integration-service", "alert_bridge": bridge}


@router.get("/{connector_id}", response_model=HealthStatusResponse)
async def connector_health(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> HealthStatusResponse:
    rbac.authorize(get_roles(principal), "health:read")
    try:
        report = await connector_service.run_health_check(session, connector_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return HealthStatusResponse(**report)

