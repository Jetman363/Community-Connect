from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.services.event_queue import event_queue_service
from app.repository import audit_repository

router = APIRouter()


@router.get("/stream")
async def read_event_stream(
    last_id: str = Query(default="0"),
    count: int = Query(default=20, le=100),
    principal: dict = Depends(require_principal),
) -> list[dict]:
    agency_id = get_agency_id(principal)
    rbac.authorize(get_roles(principal), "events:stream", agency_id)
    return await event_queue_service.read_stream(agency_id, count=count, last_id=last_id)


@router.get("/audit")
async def list_audit_logs(
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> list[dict]:
    agency_id = get_agency_id(principal)
    rbac.authorize(get_roles(principal), "events:read", agency_id)
    logs = await audit_repository.list_recent(session, agency_id)
    return [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "outcome": log.outcome,
            "metadata": log.event_metadata,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
