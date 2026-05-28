from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.registry import connector_registry
from app.db import get_db_session
from app.repository import subscription_repository
from app.schemas import SubscriptionCreateRequest
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac

router = APIRouter()


@router.get("/connectors")
async def list_connectors(principal: dict = Depends(require_principal)) -> list[dict]:
    roles = get_roles(principal)
    rbac.authorize(roles, "connector:read")
    return connector_registry.list_types()


@router.post("/subscriptions")
async def create_subscription(
    body: SubscriptionCreateRequest,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "subscription:manage", agency_id, body.agency_id)
    sub = await subscription_repository.create(session, body.model_dump())
    return {"id": sub.id, "status": "created"}


@router.get("/subscriptions")
async def list_subscriptions(
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:read", agency_id, agency_id)
    subs = await subscription_repository.list_for_agency(session, agency_id)
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "role": s.role,
            "event_types": s.event_types,
            "min_threat_level": s.min_threat_level,
            "channels": s.channels,
        }
        for s in subs
    ]
