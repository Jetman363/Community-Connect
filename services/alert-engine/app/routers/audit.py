from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import audit_repository
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac

router = APIRouter()


@router.get("")
async def list_audit_logs(
    limit: int = 100,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "audit:read", agency_id, agency_id)
    logs = await audit_repository.list_recent(session, agency_id, limit)
    return [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "outcome": log.outcome,
            "metadata": log.event_metadata,
            "hash_chain": log.hash_chain,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
