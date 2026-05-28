"""API routes for structured incident reports."""

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.incident_report_schemas import (
    IncidentReportCreateRequest,
    IncidentReportResponse,
    IncidentReportSummary,
    IncidentReportUpdateRequest,
    ReportAuditLogResponse,
    ReportRevisionResponse,
    ReportStatus,
    SupervisorApprovalRequest,
    SupervisorCommentRequest,
)
from app.incident_report_service import incident_report_service

router = APIRouter()


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def _require_identity(x_user_id: str) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing caller identity")
    return UUID(x_user_id)


def _require_agency(x_agency_id: str) -> UUID:
    if not x_agency_id:
        raise HTTPException(status_code=400, detail="Missing agency context")
    return UUID(x_agency_id)


@router.post("", response_model=IncidentReportResponse)
async def create_incident_report(
    payload: IncidentReportCreateRequest,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    if payload.agency_id and payload.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="Agency mismatch")
    try:
        return await incident_report_service.create(
            session,
            payload,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("", response_model=list[IncidentReportSummary])
async def search_incident_reports(
    request: Request,
    q: str | None = Query(default=None),
    status: ReportStatus | None = Query(default=None),
    incident_number: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> list[IncidentReportSummary]:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.search(
            session,
            agency_id=agency_id,
            q=q,
            status=status.value if status else None,
            incident_number=incident_number,
            limit=limit,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{report_id}", response_model=IncidentReportResponse)
async def get_incident_report(
    report_id: UUID,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.get(
            session,
            report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.patch("/{report_id}", response_model=IncidentReportResponse)
async def update_incident_report(
    report_id: UUID,
    payload: IncidentReportUpdateRequest,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.update(
            session,
            report_id,
            payload,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/{report_id}/autosave", response_model=IncidentReportResponse)
async def autosave_incident_report(
    report_id: UUID,
    payload: IncidentReportUpdateRequest,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.update(
            session,
            report_id,
            payload,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
            autosave=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/{report_id}/finalize", response_model=IncidentReportResponse)
async def finalize_incident_report(
    report_id: UUID,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.finalize(
            session,
            report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/{report_id}/approve", response_model=IncidentReportResponse)
async def approve_incident_report(
    report_id: UUID,
    payload: SupervisorApprovalRequest,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.approve(
            session,
            report_id,
            approved=payload.approved,
            comment=payload.comment,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/{report_id}/lock", response_model=IncidentReportResponse)
async def lock_incident_report(
    report_id: UUID,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> IncidentReportResponse:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.lock(
            session,
            report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{report_id}/audit", response_model=list[ReportAuditLogResponse])
async def get_report_audit_logs(
    report_id: UUID,
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> list[ReportAuditLogResponse]:
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.audit_logs(
            session, report_id, agency_id=agency_id, roles_header=x_roles
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{report_id}/revisions", response_model=list[ReportRevisionResponse])
async def get_report_revisions(
    report_id: UUID,
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> list[ReportRevisionResponse]:
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.revisions(
            session, report_id, agency_id=agency_id, roles_header=x_roles
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/{report_id}/export")
async def export_incident_report(
    report_id: UUID,
    request: Request,
    x_user_id: str = Header(default=""),
    x_user_email: str = Header(default=""),
    x_roles: str = Header(default=""),
    x_agency_id: str = Header(default=""),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    user_id = _require_identity(x_user_id)
    agency_id = _require_agency(x_agency_id)
    try:
        return await incident_report_service.export_pdf(
            session,
            report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=x_user_email or None,
            roles_header=x_roles,
            ip_address=_client_ip(request),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
