from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repository import incident_repository
from app.schemas import (
    IncidentCreateRequest,
    IncidentResponse,
    IncidentUpdateRequest,
    ReportCreateRequest,
    ReportResponse,
    ReportUpdateRequest,
)


def _to_response(incident) -> IncidentResponse:
    return IncidentResponse(
        id=incident.id,
        agency_id=incident.agency_id,
        report_number=incident.report_number,
        incident_type=incident.incident_type,
        location=incident.location,
        occurred_at=incident.occurred_at,
        created_by=incident.created_by,
        status=incident.status,
        created_at=incident.created_at,
    )


class IncidentService:
    async def create(self, session: AsyncSession, req: IncidentCreateRequest) -> IncidentResponse:
        incident = await incident_repository.create(
            session,
            agency_id=req.agency_id,
            report_number=req.report_number,
            incident_type=req.incident_type,
            location=req.location,
            occurred_at=req.occurred_at,
            created_by=req.created_by,
            status=req.status,
        )
        return _to_response(incident)

    async def get(self, session: AsyncSession, incident_id: UUID, agency_id: UUID | None) -> IncidentResponse:
        incident = await incident_repository.get_by_id(session, incident_id)
        if not incident:
            raise ValueError("Incident not found")
        if agency_id and incident.agency_id != agency_id:
            raise PermissionError("Cross-tenant access denied")
        return _to_response(incident)

    async def list_for_agency(self, session: AsyncSession, agency_id: UUID) -> list[IncidentResponse]:
        incidents = await incident_repository.list_by_agency(session, agency_id)
        return [_to_response(i) for i in incidents]

    async def update(
        self,
        session: AsyncSession,
        incident_id: UUID,
        agency_id: UUID | None,
        req: IncidentUpdateRequest,
    ) -> IncidentResponse:
        incident = await incident_repository.get_by_id(session, incident_id)
        if not incident:
            raise ValueError("Incident not found")
        if agency_id and incident.agency_id != agency_id:
            raise PermissionError("Cross-tenant access denied")
        updated = await incident_repository.update(
            session,
            incident,
            report_number=req.report_number,
            incident_type=req.incident_type,
            location=req.location,
            occurred_at=req.occurred_at,
            status=req.status,
        )
        return _to_response(updated)


incident_service = IncidentService()


def _report_to_response(report) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        incident_id=report.incident_id,
        officer_id=report.officer_id,
        narrative=report.narrative,
        ai_generated=report.ai_generated,
        supervisor_approved=report.supervisor_approved,
        created_at=report.created_at,
    )


class ReportService:
    async def _assert_incident_access(
        self, session: AsyncSession, incident_id: UUID, agency_id: UUID | None
    ) -> None:
        incident = await incident_repository.get_by_id(session, incident_id)
        if not incident:
            raise ValueError("Incident not found")
        if agency_id and incident.agency_id != agency_id:
            raise PermissionError("Cross-tenant access denied")

    async def create(
        self,
        session: AsyncSession,
        req: ReportCreateRequest,
        agency_id: UUID | None,
    ) -> ReportResponse:
        await self._assert_incident_access(session, req.incident_id, agency_id)
        from app.repository import report_repository

        report = await report_repository.create(
            session,
            incident_id=req.incident_id,
            officer_id=req.officer_id,
            narrative=req.narrative,
            ai_generated=req.ai_generated,
        )
        await report_repository.append_outbox(
            session,
            "rms.report.created.v1",
            {
                "report_id": str(report.id),
                "incident_id": str(report.incident_id),
                "officer_id": str(report.officer_id) if report.officer_id else None,
            },
        )
        return _report_to_response(report)

    async def get(self, session: AsyncSession, report_id: UUID, agency_id: UUID | None) -> ReportResponse:
        from app.repository import report_repository

        report = await report_repository.get_by_id(session, report_id)
        if not report or not report.incident_id:
            raise ValueError("Report not found")
        await self._assert_incident_access(session, report.incident_id, agency_id)
        return _report_to_response(report)

    async def list_for_incident(
        self, session: AsyncSession, incident_id: UUID, agency_id: UUID | None
    ) -> list[ReportResponse]:
        await self._assert_incident_access(session, incident_id, agency_id)
        from app.repository import report_repository

        reports = await report_repository.list_by_incident(session, incident_id)
        return [_report_to_response(r) for r in reports]

    async def update(
        self,
        session: AsyncSession,
        report_id: UUID,
        agency_id: UUID | None,
        req: ReportUpdateRequest,
        is_supervisor: bool = False,
    ) -> ReportResponse:
        from app.repository import report_repository

        report = await report_repository.get_by_id(session, report_id)
        if not report or not report.incident_id:
            raise ValueError("Report not found")
        await self._assert_incident_access(session, report.incident_id, agency_id)
        if req.supervisor_approved is not None and not is_supervisor:
            raise PermissionError("Supervisor role required for approval")
        updated = await report_repository.update(
            session,
            report,
            narrative=req.narrative,
            ai_generated=req.ai_generated,
            supervisor_approved=req.supervisor_approved,
        )
        return _report_to_response(updated)


report_service = ReportService()
