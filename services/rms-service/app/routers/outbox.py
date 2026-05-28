import json

from fastapi import APIRouter, Depends, HTTPException
from prometheus_client import Counter
from shared_lib.event_bus import publisher
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import report_repository

router = APIRouter()

RMS_OUTBOX_DISPATCHED = Counter("rms_outbox_dispatched_total", "Total RMS outbox events dispatched")


@router.get("/pending")
async def get_pending_outbox(session: AsyncSession = Depends(get_db_session)) -> list[dict]:
    events = await report_repository.get_pending_outbox(session)
    return [
        {
            "id": e.id,
            "topic": e.topic,
            "payload": e.payload,
            "dispatched": e.dispatched,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.post("/dispatch/{event_id}")
async def dispatch_outbox_event(event_id: int, session: AsyncSession = Depends(get_db_session)) -> dict:
    events = await report_repository.get_pending_outbox(session)
    target = next((e for e in events if e.id == event_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Outbox event not found")
    if target.dispatched:
        return {"id": event_id, "dispatched": True, "already_dispatched": True}
    await publisher.publish(target.topic, target.payload if isinstance(target.payload, dict) else json.loads(target.payload))
    updated = await report_repository.mark_outbox_dispatched(session, event_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Outbox event not found")
    RMS_OUTBOX_DISPATCHED.inc()
    return {"id": event_id, "dispatched": True}
