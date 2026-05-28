from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Unit
from app.schemas import SilentEmergencyRequest, UnitCreate, UnitOut, UnitStatusUpdate
from app.services.unit_service import create_unit, list_units, update_unit_status

router = APIRouter(prefix="/units", tags=["units"])


@router.get("", response_model=list[UnitOut])
async def get_units(agency_id: str = Query(...), db: AsyncSession = Depends(get_db)) -> list[UnitOut]:
    units = await list_units(db, agency_id)
    return [UnitOut.model_validate(u) for u in units]


@router.post("", response_model=UnitOut, status_code=201)
async def post_unit(
    payload: UnitCreate,
    actor_id: str = Query(default="admin"),
    db: AsyncSession = Depends(get_db),
) -> UnitOut:
    unit = await create_unit(db, payload, actor_id)
    return UnitOut.model_validate(unit)


@router.patch("/{unit_id}/status", response_model=UnitOut)
async def patch_unit_status(
    unit_id: UUID,
    payload: UnitStatusUpdate,
    actor_id: str = Query(default="officer"),
    db: AsyncSession = Depends(get_db),
) -> UnitOut:
    unit = await db.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    updated = await update_unit_status(db, unit, payload, actor_id)
    return UnitOut.model_validate(updated)


@router.post("/silent-emergency", status_code=201)
async def silent_emergency(payload: SilentEmergencyRequest, db: AsyncSession = Depends(get_db)) -> dict:
    unit = await db.get(Unit, payload.unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    await update_unit_status(
        db,
        unit,
        UnitStatusUpdate(status="emergency", latitude=payload.latitude, longitude=payload.longitude),
        payload.officer_id,
    )
    return {"status": "emergency_activated", "unit_id": str(payload.unit_id)}
