from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.observability.metrics import ALERTS_INGESTED, PROCESSING_LATENCY
from app.schemas import IngestEventRequest
from app.security.jwt import get_agency_id, get_roles, get_user_id, require_principal
from app.security.rbac import rbac
from app.services.ingestion import ingestion_service
from app.services.normalization import normalization_service
from app.settings import settings

router = APIRouter()


@router.post("/events")
async def ingest_event(
    body: IngestEventRequest,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:write", agency_id, body.agency_id)
    with PROCESSING_LATENCY.time():
        result = await ingestion_service.ingest_api(session, body, actor_id=get_user_id(principal))
    ALERTS_INGESTED.labels(source_system=body.source_system, threat_level=result.get("threat_level", "UNKNOWN")).inc()
    return result


@router.post("/integration")
async def ingest_integration_event(
    body: dict,
    x_bridge_secret: str = Header(default="", alias="X-Bridge-Secret"),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Internal endpoint for integration-service HTTP alert bridge fallback."""
    if x_bridge_secret != settings.alert_bridge_secret:
        raise HTTPException(status_code=401, detail="Invalid bridge secret")
    event = body.get("event")
    if not event:
        raise HTTPException(status_code=400, detail="Missing event payload")
    unified = normalization_service.from_integration_event(event)
    return await ingestion_service.ingest_unified(session, unified)
