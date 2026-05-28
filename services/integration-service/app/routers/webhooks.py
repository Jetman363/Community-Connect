from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import WebhookIngestResponse
from app.services.integration import webhook_engine

router = APIRouter()


@router.post("/{connector_id}/ingest", response_model=WebhookIngestResponse)
async def ingest_webhook(
    connector_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> WebhookIngestResponse:
    raw_body = await request.body()
    try:
        payload = await request.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid JSON payload") from exc
    headers = {k: v for k, v in request.headers.items()}
    try:
        return await webhook_engine.ingest(session, connector_id, payload, headers, raw_body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
