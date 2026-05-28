from fastapi import APIRouter, Depends, Header, HTTPException, Request
from shared_lib.security import decode_jwt_token
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import WebhookIngestRequest
from app.security.jwt import get_agency_id, get_roles
from app.security.rbac import rbac
from app.services.ingestion import ingestion_service
from app.settings import settings

router = APIRouter()


async def optional_principal(request: Request) -> dict | None:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.removeprefix("Bearer ").strip()
    try:
        return decode_jwt_token(token, settings.jwt_secret, [settings.jwt_algorithm])
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid token") from exc


@router.post("/{connector_type}")
async def webhook_ingest(
    connector_type: str,
    body: WebhookIngestRequest,
    agency_id: str | None = None,
    x_webhook_secret: str | None = Header(default=None),
    principal: dict | None = Depends(optional_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    if principal:
        roles = get_roles(principal)
        token_agency = get_agency_id(principal)
        rbac.authorize(roles, "webhook:ingest", token_agency, agency_id or token_agency)
        agency_id = agency_id or token_agency
    elif not agency_id:
        raise HTTPException(status_code=401, detail="Agency ID or bearer token required")
    _ = x_webhook_secret
    return await ingestion_service.ingest_webhook(session, agency_id, connector_type, body.payload)
