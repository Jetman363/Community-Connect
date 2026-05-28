from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import ConnectorCreateRequest, ConnectorResponse, ConnectorUpdateRequest, CredentialCreateRequest, CredentialResponse
from app.security.jwt import get_agency_id, get_roles, require_principal
from app.security.rbac import rbac
from app.services.integration import connector_service
from app.repository import audit_repository, credential_repository

router = APIRouter()


@router.get("/types")
async def list_connector_types(principal: dict = Depends(require_principal)) -> list[dict]:
    rbac.authorize(get_roles(principal), "connector:read")
    return connector_service.list_connector_types()


@router.post("", response_model=ConnectorResponse)
async def create_connector(
    payload: ConnectorCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> ConnectorResponse:
    rbac.authorize(get_roles(principal), "connector:write", get_agency_id(principal), payload.agency_id)
    return await connector_service.create_connector(session, payload, principal.get("sub", ""))


@router.get("", response_model=list[ConnectorResponse])
async def list_connectors(
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> list[ConnectorResponse]:
    agency_id = get_agency_id(principal)
    rbac.authorize(get_roles(principal), "connector:read", agency_id)
    return await connector_service.list_connectors(session, agency_id)


@router.get("/{connector_id}", response_model=ConnectorResponse)
async def get_connector(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> ConnectorResponse:
    rbac.authorize(get_roles(principal), "connector:read")
    result = await connector_service.get_connector(session, connector_id)
    if not result:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "connector:read", get_agency_id(principal), result.agency_id)
    return result


@router.patch("/{connector_id}", response_model=ConnectorResponse)
async def update_connector(
    connector_id: str,
    payload: ConnectorUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> ConnectorResponse:
    rbac.authorize(get_roles(principal), "connector:write")
    existing = await connector_service.get_connector(session, connector_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "connector:write", get_agency_id(principal), existing.agency_id)
    await connector_service.assert_agency_permission(session, existing.agency_id, connector_id, get_roles(principal))
    try:
        return await connector_service.update_connector(session, connector_id, payload, principal.get("sub", ""))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{connector_id}")
async def delete_connector(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "connector:delete")
    existing = await connector_service.get_connector(session, connector_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "connector:delete", get_agency_id(principal), existing.agency_id)
    await connector_service.assert_agency_permission(session, existing.agency_id, connector_id, get_roles(principal))
    try:
        await connector_service.delete_connector(session, connector_id, principal.get("sub", ""))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"deleted": True, "connector_id": connector_id}


@router.post("/{connector_id}/credentials", response_model=CredentialResponse)
async def store_credential(
    connector_id: str,
    payload: CredentialCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> CredentialResponse:
    rbac.authorize(get_roles(principal), "credential:write")
    connector = await connector_service.get_connector(session, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "credential:write", get_agency_id(principal), connector.agency_id)
    cred = await credential_repository.store(
        session, connector_id, payload.credential_type, payload.value, payload.expires_at
    )
    await audit_repository.log(
        session, principal.get("sub"), connector.agency_id, "credential.store", "credential", str(cred.id), "success"
    )
    return CredentialResponse(
        id=cred.id,
        connector_id=cred.connector_id,
        credential_type=cred.credential_type,
        expires_at=cred.expires_at,
        created_at=cred.created_at,
    )


@router.get("/{connector_id}/credentials", response_model=list[CredentialResponse])
async def list_credentials(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> list[CredentialResponse]:
    rbac.authorize(get_roles(principal), "credential:read")
    connector = await connector_service.get_connector(session, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "credential:read", get_agency_id(principal), connector.agency_id)
    creds = await credential_repository.list_metadata(session, connector_id)
    return [
        CredentialResponse(
            id=c.id,
            connector_id=c.connector_id,
            credential_type=c.credential_type,
            expires_at=c.expires_at,
            created_at=c.created_at,
        )
        for c in creds
    ]


@router.post("/{connector_id}/credentials/{credential_id}/rotate", response_model=CredentialResponse)
async def rotate_credential(
    connector_id: str,
    credential_id: int,
    payload: CredentialCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> CredentialResponse:
    rbac.authorize(get_roles(principal), "credential:write")
    connector = await connector_service.get_connector(session, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    cred = await credential_repository.rotate(session, credential_id, payload.value)
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    await audit_repository.log(
        session, principal.get("sub"), connector.agency_id, "credential.rotate", "credential", str(cred.id), "success"
    )
    return CredentialResponse(
        id=cred.id,
        connector_id=cred.connector_id,
        credential_type=cred.credential_type,
        expires_at=cred.expires_at,
        created_at=cred.created_at,
    )


@router.delete("/{connector_id}/credentials/{credential_id}")
async def delete_credential(
    connector_id: str,
    credential_id: int,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "credential:write")
    connector = await connector_service.get_connector(session, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    deleted = await credential_repository.delete(session, credential_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Credential not found")
    await audit_repository.log(
        session, principal.get("sub"), connector.agency_id, "credential.delete", "credential", str(credential_id), "success"
    )
    return {"deleted": True, "credential_id": credential_id}


@router.post("/{connector_id}/test")
async def test_connector(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "connector:write")
    connector = await connector_service.get_connector(session, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    rbac.authorize(get_roles(principal), "connector:write", get_agency_id(principal), connector.agency_id)
    try:
        report = await connector_service.run_health_check(session, connector_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await audit_repository.log(
        session, principal.get("sub"), connector.agency_id, "connector.test", "connector", connector_id, "success"
    )
    return report


@router.post("/{connector_id}/poll")
async def poll_connector(
    connector_id: str,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "connector:write")
    try:
        count = await connector_service.poll_connector(session, connector_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"connector_id": connector_id, "events_published": count}
