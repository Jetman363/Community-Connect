from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import routing_rule_repository
from app.schemas import RoutingRuleCreateRequest, RoutingRuleUpdateRequest
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac

router = APIRouter()

RULE_TYPES = [
    "geofence_trigger",
    "vehicle_match",
    "keyword_incident",
    "bolo_hit",
    "officer_emergency",
    "repeat_offender",
    "gang_intelligence",
    "stolen_vehicle",
    "suspicious_vehicle_pattern",
    "custom",
]


def _rule_dict(rule) -> dict:
    return {
        "id": rule.id,
        "agency_id": rule.agency_id,
        "name": rule.name,
        "rule_type": rule.rule_type,
        "priority": rule.priority,
        "conditions": rule.conditions,
        "actions": rule.actions,
        "enabled": rule.enabled,
        "created_at": rule.created_at.isoformat() if rule.created_at else None,
    }


@router.get("/types")
async def list_rule_types() -> list[dict]:
    return [{"type": t, "label": t.replace("_", " ").title()} for t in RULE_TYPES]


@router.post("")
async def create_rule(
    body: RoutingRuleCreateRequest,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "rule:manage", agency_id, body.agency_id)
    rule = await routing_rule_repository.create(session, body.model_dump())
    return {"id": rule.id, "name": rule.name, "status": "created"}


@router.get("")
async def list_rules(
    include_disabled: bool = False,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[dict]:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "rule:read" if _has_perm(roles, "rule:read") else "rule:manage", agency_id, agency_id)
    if include_disabled:
        rules = await routing_rule_repository.list_all(session, agency_id)
    else:
        rules = await routing_rule_repository.list_enabled(session, agency_id)
    return [_rule_dict(r) for r in rules]


@router.get("/{rule_id}")
async def get_rule(
    rule_id: str,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "rule:read" if _has_perm(roles, "rule:read") else "rule:manage", agency_id, agency_id)
    rule = await routing_rule_repository.get(session, rule_id)
    if not rule or rule.agency_id != agency_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    return _rule_dict(rule)


@router.patch("/{rule_id}")
async def update_rule(
    rule_id: str,
    body: RoutingRuleUpdateRequest,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "rule:manage", agency_id, agency_id)
    rule = await routing_rule_repository.get(session, rule_id)
    if not rule or rule.agency_id != agency_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    updated = await routing_rule_repository.update(session, rule, **body.model_dump(exclude_unset=True))
    return _rule_dict(updated)


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: str,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "rule:manage", agency_id, agency_id)
    rule = await routing_rule_repository.get(session, rule_id)
    if not rule or rule.agency_id != agency_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    await routing_rule_repository.delete(session, rule)
    return {"deleted": True, "rule_id": rule_id}


def _has_perm(roles: list[str], perm: str) -> bool:
    return perm in _perms(roles)


def _perms(roles: list[str]) -> set[str]:
    from app.security.rbac import ROLE_PERMISSIONS

    out: set[str] = set()
    for r in roles:
        out |= ROLE_PERMISSIONS.get(r, set())
    return out
