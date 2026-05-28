from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import BoloAlert, DispatchMessage, EmergencyCall, WarrantFlag
from app.schemas import (
    BoloCreate,
    BoloOut,
    EmergencyCallCreate,
    EmergencyCallOut,
    EmergencyCallUpdate,
    MessageCreate,
    MessageOut,
)

router = APIRouter(tags=["calls"])


@router.get("/calls", response_model=list[EmergencyCallOut])
async def list_calls(agency_id: str = Query(...), db: AsyncSession = Depends(get_db)) -> list[EmergencyCallOut]:
    result = await db.execute(
        select(EmergencyCall).where(EmergencyCall.agency_id == agency_id).order_by(EmergencyCall.started_at.desc())
    )
    return [EmergencyCallOut.model_validate(c) for c in result.scalars().all()]


@router.post("/calls", response_model=EmergencyCallOut, status_code=201)
async def create_call(payload: EmergencyCallCreate, db: AsyncSession = Depends(get_db)) -> EmergencyCallOut:
    call = EmergencyCall(**payload.model_dump())
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return EmergencyCallOut.model_validate(call)


@router.patch("/calls/{call_id}", response_model=EmergencyCallOut)
async def update_call(
    call_id: UUID, payload: EmergencyCallUpdate, db: AsyncSession = Depends(get_db)
) -> EmergencyCallOut:
    call = await db.get(EmergencyCall, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(call, field, value)
    await db.commit()
    await db.refresh(call)
    return EmergencyCallOut.model_validate(call)


@router.get("/bolos", response_model=list[BoloOut])
async def list_bolos(agency_id: str = Query(...), db: AsyncSession = Depends(get_db)) -> list[BoloOut]:
    result = await db.execute(
        select(BoloAlert).where(BoloAlert.agency_id == agency_id, BoloAlert.active.is_(True))
    )
    return [BoloOut.model_validate(b) for b in result.scalars().all()]


@router.post("/bolos", response_model=BoloOut, status_code=201)
async def create_bolo(payload: BoloCreate, db: AsyncSession = Depends(get_db)) -> BoloOut:
    bolo = BoloAlert(**payload.model_dump())
    db.add(bolo)
    await db.commit()
    await db.refresh(bolo)
    return BoloOut.model_validate(bolo)


@router.get("/messages", response_model=list[MessageOut])
async def list_messages(
    agency_id: str = Query(...),
    incident_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[MessageOut]:
    query = select(DispatchMessage).where(DispatchMessage.agency_id == agency_id)
    if incident_id:
        query = query.where(DispatchMessage.incident_id == incident_id)
    result = await db.execute(query.order_by(DispatchMessage.created_at.desc()).limit(200))
    return [MessageOut.model_validate(m) for m in result.scalars().all()]


@router.post("/messages", response_model=MessageOut, status_code=201)
async def post_message(payload: MessageCreate, db: AsyncSession = Depends(get_db)) -> MessageOut:
    msg = DispatchMessage(**payload.model_dump())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)


@router.get("/warrants")
async def list_warrants(agency_id: str = Query(...), db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(WarrantFlag).where(WarrantFlag.agency_id == agency_id, WarrantFlag.active.is_(True))
    )
    return [
        {
            "id": str(w.id),
            "subject_name": w.subject_name,
            "warrant_type": w.warrant_type,
            "case_number": w.case_number,
            "location_hint": w.location_hint,
        }
        for w in result.scalars().all()
    ]
