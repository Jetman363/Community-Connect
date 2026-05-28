from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import OAuth2TokenRequest
from app.security.jwt import get_roles, require_principal
from app.security.rbac import rbac
from app.repository import audit_repository, oauth2_repository
from app.services.integration import connector_service

router = APIRouter()


@router.post("/tokens")
async def store_oauth2_token(
    payload: OAuth2TokenRequest,
    session: AsyncSession = Depends(get_db_session),
    principal: dict = Depends(require_principal),
) -> dict:
    rbac.authorize(get_roles(principal), "credential:write")
    connector = await connector_service.get_connector(session, payload.connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    token = await oauth2_repository.store_token(
        session,
        payload.connector_id,
        payload.access_token,
        payload.refresh_token,
        payload.expires_at,
        payload.scopes,
    )
    await audit_repository.log(
        session,
        principal.get("sub"),
        connector.agency_id,
        "oauth2.store",
        "oauth2_token",
        str(token.id),
        "success",
    )
    return {"id": token.id, "connector_id": token.connector_id, "expires_at": token.expires_at.isoformat()}
