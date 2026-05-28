from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.schemas import IncidentCreateRequest, IncidentResponse, IncidentUpdateRequest
from app.service import incident_service

router = APIRouter()


@router.post("", response_model=IncidentResponse)
async def create_incident(
    payload: IncidentCreateRequest,
    x_user_id: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentResponse:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing caller identity")
    if x_agency_id and str(payload.agency_id) != x_agency_id:
        raise HTTPException(status_code=403, detail="Cross-tenant write denied")
    if payload.created_by is None and x_user_id:
        payload.created_by = UUID(x_user_id)
    try:
        return await incident_service.create(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> list[IncidentResponse]:
    if not x_agency_id:
        raise HTTPException(status_code=400, detail="X-Agency-Id header required")
    return await incident_service.list_for_agency(session, UUID(x_agency_id))


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: UUID,
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentResponse:
    agency_id = UUID(x_agency_id) if x_agency_id else None
    try:
        return await incident_service.get(session, incident_id, agency_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: UUID,
    payload: IncidentUpdateRequest,
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentResponse:
    agency_id = UUID(x_agency_id) if x_agency_id else None
    try:
        return await incident_service.update(session, incident_id, agency_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
