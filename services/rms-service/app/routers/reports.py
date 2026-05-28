from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from prometheus_client import Counter
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import report_repository
from app.schemas import ReportCreateRequest, ReportResponse, ReportUpdateRequest
from app.service import report_service

router = APIRouter()

RMS_REPORTS_CREATED = Counter("rms_reports_created_total", "Total RMS reports created")
RMS_IDEMPOTENT_HITS = Counter("rms_idempotent_hits_total", "Total idempotency replay hits")


@router.post("", response_model=ReportResponse)
async def create_report(
    payload: ReportCreateRequest,
    x_user_id: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    x_idempotency_key: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> ReportResponse:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing caller identity")
    if "officer" not in x_roles and "detective" not in x_roles and "supervisor" not in x_roles:
        raise HTTPException(status_code=403, detail="Insufficient role")

    if x_idempotency_key:
        existing = await report_repository.get_idempotency(session, x_idempotency_key)
        if existing:
            RMS_IDEMPOTENT_HITS.inc()
            return ReportResponse(**existing.response_json)

    if payload.officer_id is None and x_user_id:
        payload.officer_id = UUID(x_user_id)

    agency_id = UUID(x_agency_id) if x_agency_id else None
    try:
        report = await report_service.create(session, payload, agency_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    if x_idempotency_key:
        await report_repository.save_idempotency(session, x_idempotency_key, report.model_dump(mode="json"))

    RMS_REPORTS_CREATED.inc()
    return report


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    incident_id: UUID = Query(...),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> list[ReportResponse]:
    agency_id = UUID(x_agency_id) if x_agency_id else None
    try:
        return await report_service.list_for_incident(session, incident_id, agency_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> ReportResponse:
    agency_id = UUID(x_agency_id) if x_agency_id else None
    try:
        return await report_service.get(session, report_id, agency_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    payload: ReportUpdateRequest,
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> ReportResponse:
    agency_id = UUID(x_agency_id) if x_agency_id else None
    is_supervisor = "supervisor" in x_roles or "admin" in x_roles
    try:
        return await report_service.update(session, report_id, agency_id, payload, is_supervisor)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/v2", response_model=ReportResponse)
async def create_report_v2(
    payload: ReportCreateRequest,
    x_user_id: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    x_idempotency_key: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> ReportResponse:
    return await create_report(payload, x_user_id, x_roles, x_agency_id, x_idempotency_key, session)
