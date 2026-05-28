import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin_repository import admin_repository
from app.admin_schemas import (
    AdminAuditLogResponse,
    AdminResetPasswordRequest,
    AdminUserUpdateRequest,
    PersonnelCreateRequest,
    PersonnelResponse,
    PersonnelUpdateRequest,
)
from app.db import get_db_session
from app.schemas import UserCreateRequest, UserResponse
from app.security.admin_auth import agency_id_from, client_meta, require_admin_principal, require_perm
from app.service import auth_service, _hash_password as hash_password

router = APIRouter()


def _user_response(user) -> UserResponse:
    return UserResponse(
        id=user.id,
        agency_id=user.agency_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        rank=user.rank,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def _personnel_response(p) -> PersonnelResponse:
    return PersonnelResponse(
        id=p.id,
        agency_id=p.agency_id,
        badge_id=p.badge_id,
        first_name=p.first_name,
        last_name=p.last_name,
        unit=p.unit,
        rank=p.rank,
        email=p.email,
        phone=p.phone,
        clearance_level=p.clearance_level,
        is_active=p.is_active,
        metadata_json=p.metadata_json,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


async def _audit(
    session: AsyncSession,
    request: Request,
    principal: dict,
    action: str,
    resource_type: str,
    resource_id: str | None,
    before: dict | None,
    after: dict | None,
) -> None:
    ip, ua = client_meta(request)
    await admin_repository.log_audit(
        session,
        agency_id=UUID(agency_id_from(principal)),
        actor_id=principal.get("sub", "unknown"),
        actor_username=None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        before_state=before,
        after_state=after,
        ip_address=ip,
        user_agent=ua,
    )


# --- User Management ---


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    request: Request,
    q: str | None = Query(default=None),
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[UserResponse]:
    require_perm(principal, "user:read")
    users = await admin_repository.list_users(session, UUID(agency_id_from(principal)), q)
    return [_user_response(u) for u in users]


@router.post("/users", response_model=UserResponse)
async def create_user_admin(
    payload: UserCreateRequest,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    require_perm(principal, "user:write")
    agency = agency_id_from(principal)
    if str(payload.agency_id) != agency:
        raise HTTPException(status_code=403, detail="Cross-agency user creation denied")
    try:
        user = await auth_service.register(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await _audit(session, request, principal, "user.create", "user", str(user.id), None, user.model_dump(mode="json"))
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: AdminUserUpdateRequest,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    require_perm(principal, "user:write")
    user = await admin_repository.get_user(session, user_id)
    if not user or str(user.agency_id) != agency_id_from(principal):
        raise HTTPException(status_code=404, detail="User not found")
    before = _user_response(user).model_dump(mode="json")
    updated = await admin_repository.update_user(session, user, **payload.model_dump(exclude_unset=True))
    after = _user_response(updated).model_dump(mode="json")
    await _audit(session, request, principal, "user.update", "user", str(user_id), before, after)
    return _user_response(updated)


@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: UUID,
    payload: AdminResetPasswordRequest,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    require_perm(principal, "user:write")
    user = await admin_repository.get_user(session, user_id)
    if not user or str(user.agency_id) != agency_id_from(principal):
        raise HTTPException(status_code=404, detail="User not found")
    await admin_repository.reset_password(session, user, hash_password(payload.new_password))
    await _audit(session, request, principal, "user.reset_password", "user", str(user_id), None, {"reset": True})
    return {"status": "password_reset", "user_id": str(user_id)}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    require_perm(principal, "user:delete")
    user = await admin_repository.get_user(session, user_id)
    if not user or str(user.agency_id) != agency_id_from(principal):
        raise HTTPException(status_code=404, detail="User not found")
    before = _user_response(user).model_dump(mode="json")
    await admin_repository.delete_user(session, user)
    await _audit(session, request, principal, "user.delete", "user", str(user_id), before, None)
    return {"deleted": True, "user_id": str(user_id)}


# --- Personnel Directory ---


@router.get("/personnel", response_model=list[PersonnelResponse])
async def list_personnel(
    q: str | None = Query(default=None),
    unit: str | None = Query(default=None),
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[PersonnelResponse]:
    require_perm(principal, "personnel:read")
    records = await admin_repository.list_personnel(session, UUID(agency_id_from(principal)), q, unit)
    return [_personnel_response(p) for p in records]


@router.post("/personnel", response_model=PersonnelResponse)
async def create_personnel(
    payload: PersonnelCreateRequest,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> PersonnelResponse:
    require_perm(principal, "personnel:write")
    if str(payload.agency_id) != agency_id_from(principal):
        raise HTTPException(status_code=403, detail="Cross-agency personnel creation denied")
    record = await admin_repository.create_personnel(session, payload.model_dump())
    await _audit(session, request, principal, "personnel.create", "personnel", str(record.id), None, payload.model_dump(mode="json"))
    return _personnel_response(record)


@router.patch("/personnel/{personnel_id}", response_model=PersonnelResponse)
async def update_personnel(
    personnel_id: UUID,
    payload: PersonnelUpdateRequest,
    request: Request,
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> PersonnelResponse:
    require_perm(principal, "personnel:write")
    record = await admin_repository.get_personnel(session, personnel_id)
    if not record or str(record.agency_id) != agency_id_from(principal):
        raise HTTPException(status_code=404, detail="Personnel not found")
    before = _personnel_response(record).model_dump(mode="json")
    updated = await admin_repository.update_personnel(session, record, **payload.model_dump(exclude_unset=True))
    await _audit(session, request, principal, "personnel.update", "personnel", str(personnel_id), before, _personnel_response(updated).model_dump(mode="json"))
    return _personnel_response(updated)


# --- Audit Logs ---


@router.get("/audit", response_model=list[AdminAuditLogResponse])
async def list_audit_logs(
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    actor_id: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[AdminAuditLogResponse]:
    require_perm(principal, "audit:read")
    logs = await admin_repository.list_audit_logs(
        session, UUID(agency_id_from(principal)), action, resource_type, actor_id, limit
    )
    return [
        AdminAuditLogResponse(
            id=log.id,
            agency_id=log.agency_id,
            actor_id=log.actor_id,
            actor_username=log.actor_username,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            before_state=log.before_state,
            after_state=log.after_state,
            ip_address=log.ip_address,
            status=log.status,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.get("/audit/export")
async def export_audit_logs(
    principal: dict = Depends(require_admin_principal),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    require_perm(principal, "audit:export")
    logs = await admin_repository.list_audit_logs(session, UUID(agency_id_from(principal)), limit=500)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "actor_id", "action", "resource_type", "resource_id", "ip_address", "status", "created_at"])
    for log in logs:
        writer.writerow([
            log.id,
            log.actor_id,
            log.action,
            log.resource_type,
            log.resource_id or "",
            log.ip_address or "",
            log.status,
            log.created_at.isoformat(),
        ])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=admin_audit_export.csv"},
    )
