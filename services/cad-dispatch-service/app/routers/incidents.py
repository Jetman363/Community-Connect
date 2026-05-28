from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas import (
    AssignUnitRequest,
    IncidentCreate,
    IncidentOut,
    IncidentUpdate,
    RemarkCreate,
    UnitAssignmentOut,
    UnitRecommendation,
)
from app.services import incident_service
from app.services.unit_service import recommend_units

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _serialize_incident(incident) -> IncidentOut:
    meta = incident.metadata_json or {}
    assignments = [
        UnitAssignmentOut(
            id=a.id,
            unit_id=a.unit_id,
            call_sign=a.unit.call_sign if a.unit else None,
            assigned_at=a.assigned_at,
            cleared_at=a.cleared_at,
            is_primary=a.is_primary,
        )
        for a in incident.assignments
    ]
    data = IncidentOut.model_validate(incident)
    data.assignments = assignments
    data.case_number = meta.get("case_number")
    data.report_required = bool(meta.get("report_required") or meta.get("case_number"))
    return data


@router.get("", response_model=list[IncidentOut])
async def list_incidents(
    agency_id: str = Query(...),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[IncidentOut]:
    incidents = await incident_service.list_incidents(db, agency_id, status)
    return [_serialize_incident(i) for i in incidents]


@router.post("", response_model=IncidentOut, status_code=201)
async def create_incident(
    payload: IncidentCreate,
    actor_id: str = Query(default="system"),
    db: AsyncSession = Depends(get_db),
) -> IncidentOut:
    incident = await incident_service.create_incident(db, payload, actor_id)
    loaded = await incident_service.get_incident(db, incident.id)
    return _serialize_incident(loaded)


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: UUID, db: AsyncSession = Depends(get_db)) -> IncidentOut:
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return _serialize_incident(incident)


@router.patch("/{incident_id}", response_model=IncidentOut)
async def update_incident(
    incident_id: UUID,
    payload: IncidentUpdate,
    actor_id: str = Query(default="system"),
    db: AsyncSession = Depends(get_db),
) -> IncidentOut:
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    updated = await incident_service.update_incident(db, incident, payload, actor_id)
    loaded = await incident_service.get_incident(db, updated.id)
    return _serialize_incident(loaded)


@router.post("/{incident_id}/create-case", response_model=IncidentOut)
async def create_case(
    incident_id: UUID,
    actor_id: str = Query(default="officer"),
    db: AsyncSession = Depends(get_db),
) -> IncidentOut:
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        updated, _case = await incident_service.create_case_number(db, incident, actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    loaded = await incident_service.get_incident(db, updated.id)
    return _serialize_incident(loaded)


@router.post("/{incident_id}/assign", response_model=UnitAssignmentOut, status_code=201)
async def assign_unit(
    incident_id: UUID,
    payload: AssignUnitRequest,
    actor_id: str = Query(default="dispatcher"),
    db: AsyncSession = Depends(get_db),
) -> UnitAssignmentOut:
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        assignment = await incident_service.assign_unit(db, incident, payload, actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return UnitAssignmentOut.model_validate(assignment)


@router.post("/{incident_id}/remarks", status_code=201)
async def add_remark(
    incident_id: UUID,
    payload: RemarkCreate,
    db: AsyncSession = Depends(get_db),
):
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    remark = await incident_service.add_remark(db, incident, payload)
    return remark


@router.get("/{incident_id}/recommendations", response_model=list[UnitRecommendation])
async def get_recommendations(incident_id: UUID, db: AsyncSession = Depends(get_db)) -> list[UnitRecommendation]:
    incident = await incident_service.get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return await recommend_units(
        db, incident.agency_id, incident.latitude, incident.longitude, incident.incident_type
    )
