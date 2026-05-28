from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import PermissionGrantRequest, PermissionResponse
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.repository import audit_repository, permission_repository

router = APIRouter()


@router.post("", response_model=PermissionResponse)
async def grant_permission(
    payload: PermissionGrantRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> PermissionResponse:
    rbac.authorize(get_roles(principal), "permission:manage", get_agency_id(principal), payload.agency_id)
    perm = await permission_repository.grant(
        session, payload.agency_id, payload.connector_id, payload.role, principal.get("sub", "")
    )
    await audit_repository.log(
        session, principal.get("sub"), payload.agency_id, "permission.grant", "permission", str(perm.id), "success"
    )
    return PermissionResponse(
        id=perm.id,
        agency_id=perm.agency_id,
        connector_id=perm.connector_id,
        role=perm.role,
        granted_by=perm.granted_by,
    )


@router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> list[PermissionResponse]:
    agency_id = get_agency_id(principal)
    rbac.authorize(get_roles(principal), "permission:manage", agency_id)
    perms = await permission_repository.list_for_agency(session, agency_id)
    return [
        PermissionResponse(
            id=p.id, agency_id=p.agency_id, connector_id=p.connector_id, role=p.role, granted_by=p.granted_by
        )
        for p in perms
    ]


@router.delete("/{permission_id}")
async def revoke_permission(
    permission_id: int,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "permission:manage")
    deleted = await permission_repository.revoke(session, permission_id)
    if not deleted:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Permission not found")
    await audit_repository.log(
        session, principal.get("sub"), get_agency_id(principal), "permission.revoke", "permission", str(permission_id), "success"
    )
    return {"deleted": True, "permission_id": permission_id}
