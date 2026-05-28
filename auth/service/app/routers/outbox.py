from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db_session
from app.service import auth_service

router = APIRouter()


@router.get("/pending")
async def get_pending_outbox(session: AsyncSession = Depends(get_db_session)) -> list[dict]:
    return await auth_service.pending_outbox(session)


@router.post("/dispatch/{event_id}")
async def dispatch_outbox_event(event_id: int, session: AsyncSession = Depends(get_db_session)) -> dict:
    try:
        return await auth_service.dispatch_outbox_event(session, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
