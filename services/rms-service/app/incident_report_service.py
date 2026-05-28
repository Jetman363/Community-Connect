"""Business logic for structured incident reports."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.incident_report_repository import incident_report_repository
from app.incident_report_schemas import (
    IncidentReportCreateRequest,
    IncidentReportResponse,
    IncidentReportSummary,
    IncidentReportUpdateRequest,
    NarrativeRevision,
    ReportAuditLogResponse,
    ReportHeader,
    ReportRevisionResponse,
    ReportStatus,
    SupervisorComment,
    VictimEntry,
    SuspectEntry,
    VehicleEntry,
    WeaponEntry,
    NarcoticEntry,
    PropertyEntry,
)

WRITE_ROLES = frozenset({"officer", "detective", "supervisor", "admin", "superadmin"})
APPROVE_ROLES = frozenset({"supervisor", "admin", "superadmin"})
ADMIN_ROLES = frozenset({"admin", "superadmin"})
READ_ROLES = frozenset({"officer", "detective", "supervisor", "admin", "superadmin", "analyst", "viewer"})


def _parse_roles(roles_header: str) -> set[str]:
    return {r.strip().lower() for r in roles_header.split(",") if r.strip()}


def _can_read(roles: set[str]) -> bool:
    return bool(roles & READ_ROLES)


def _can_write(roles: set[str], report, user_id: UUID | None) -> bool:
    if report.locked or report.status in (ReportStatus.FINALIZED.value, ReportStatus.LOCKED.value):
        return bool(roles & ADMIN_ROLES)
    if roles & ADMIN_ROLES or roles & {"supervisor"}:
        return True
    if report.created_by and user_id and report.created_by == user_id:
        return True
    return bool(roles & {"officer", "detective"})


def _can_approve(roles: set[str]) -> bool:
    return bool(roles & APPROVE_ROLES)


def _cji_authorized(roles: set[str]) -> bool:
    return bool(roles & (WRITE_ROLES | {"analyst"}))


def _header_from_report(report) -> ReportHeader:
    return ReportHeader(
        incident_number=report.incident_number,
        case_number=report.case_number,
        report_date=report.report_date,
        report_time=report.report_time,
        reporting_officer_id=report.reporting_officer_id,
        reporting_officer_name=report.reporting_officer_name,
        assisting_officers=report.assisting_officers or [],
        supervisor_id=report.supervisor_id,
        supervisor_name=report.supervisor_name,
        incident_location=report.incident_location,
        incident_type=report.incident_type,
        call_type=report.call_type,
        priority_level=report.priority_level,
        agency=report.agency,
        division_unit=report.division_unit,
    )


def _to_response(report, roles: set[str], user_id: UUID | None) -> IncidentReportResponse:
    from app.cji_crypto import reveal_cji_fields

    authorized = _cji_authorized(roles)
    victims = [
        VictimEntry(**reveal_cji_fields(v.data, authorized))
        for v in sorted(report.victims, key=lambda x: x.sort_order)
    ]
    suspects = [
        SuspectEntry(**reveal_cji_fields({**s.data, "is_unknown": s.is_unknown}, authorized))
        for s in sorted(report.suspects, key=lambda x: x.sort_order)
    ]
    vehicles = [VehicleEntry(**v.data) for v in sorted(report.vehicles, key=lambda x: x.sort_order)]
    weapons = [WeaponEntry(**w.data) for w in sorted(report.weapons, key=lambda x: x.sort_order)]
    narcotics = [NarcoticEntry(**n.data) for n in sorted(report.narcotics, key=lambda x: x.sort_order)]
    property_items = [PropertyEntry(**p.data) for p in sorted(report.property_items, key=lambda x: x.sort_order)]
    revisions = [NarrativeRevision(**r) for r in (report.narrative_revisions or [])]
    comments = [SupervisorComment(**c) for c in (report.supervisor_comments or [])]

    return IncidentReportResponse(
        id=report.id,
        agency_id=report.agency_id,
        status=ReportStatus(report.status),
        locked=report.locked,
        header=_header_from_report(report),
        victims=victims,
        suspects=suspects,
        vehicles=vehicles,
        weapons=weapons,
        narcotics=narcotics,
        property_items=property_items,
        narrative=report.narrative,
        narrative_revisions=revisions,
        supervisor_comments=comments,
        created_by=report.created_by,
        updated_by=report.updated_by,
        finalized_at=report.finalized_at,
        approved_at=report.approved_at,
        approved_by=report.approved_by,
        created_at=report.created_at,
        updated_at=report.updated_at,
        editable=_can_write(roles, report, user_id),
        cji_authorized=authorized,
    )


def _apply_header(report, header: ReportHeader) -> None:
    report.incident_number = header.incident_number
    report.case_number = header.case_number
    report.report_date = header.report_date
    report.report_time = header.report_time
    report.reporting_officer_id = header.reporting_officer_id
    report.reporting_officer_name = header.reporting_officer_name
    report.assisting_officers = header.assisting_officers
    report.supervisor_id = header.supervisor_id
    report.supervisor_name = header.supervisor_name
    report.incident_location = header.incident_location
    report.incident_type = header.incident_type
    report.call_type = header.call_type
    report.priority_level = header.priority_level
    report.agency = header.agency
    report.division_unit = header.division_unit


class IncidentReportService:
    async def _audit(
        self,
        session: AsyncSession,
        *,
        report_id: UUID | None,
        agency_id: UUID | None,
        user_id: UUID | None,
        user_email: str | None,
        action: str,
        ip_address: str | None,
        details: dict | None = None,
        suspicious: bool = False,
    ) -> None:
        await incident_report_repository.log_audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            ip_address=ip_address,
            details=details,
            suspicious=suspicious,
        )

    async def create(
        self,
        session: AsyncSession,
        req: IncidentReportCreateRequest,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        if not _can_read(roles):
            await self._audit(
                session,
                report_id=None,
                agency_id=agency_id,
                user_id=user_id,
                user_email=user_email,
                action="access_denied",
                ip_address=ip_address,
                details={"operation": "create_report"},
                suspicious=True,
            )
            raise PermissionError("Insufficient role to create reports")

        header = req.header
        report = await incident_report_repository.create(
            session,
            agency_id=agency_id,
            incident_number=header.incident_number,
            case_number=header.case_number,
            report_date=header.report_date,
            report_time=header.report_time,
            reporting_officer_id=header.reporting_officer_id or user_id,
            reporting_officer_name=header.reporting_officer_name,
            assisting_officers=header.assisting_officers,
            supervisor_id=header.supervisor_id,
            supervisor_name=header.supervisor_name,
            incident_location=header.incident_location,
            incident_type=header.incident_type,
            call_type=header.call_type,
            priority_level=header.priority_level,
            agency=header.agency,
            division_unit=header.division_unit,
            narrative=req.narrative,
            narrative_revisions=[],
            supervisor_comments=[],
            status=ReportStatus.DRAFT.value,
            created_by=user_id,
            updated_by=user_id,
        )

        await incident_report_repository.sync_children(
            session,
            report,
            [v.model_dump() for v in req.victims],
            [s.model_dump() for s in req.suspects],
            [v.model_dump() for v in req.vehicles],
            [w.model_dump() for w in req.weapons],
            [n.model_dump() for n in req.narcotics],
            [p.model_dump() for p in req.property_items],
        )
        await session.commit()
        report = await incident_report_repository.get_full(session, report.id)
        assert report

        snapshot = incident_report_repository.build_snapshot(report, _cji_authorized(roles))
        await incident_report_repository.add_revision(
            session, report.id, 1, snapshot, user_id, "Initial report creation"
        )
        await self._audit(
            session,
            report_id=report.id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_created",
            ip_address=ip_address,
        )
        return _to_response(report, roles, user_id)

    async def get(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        if not _can_read(roles):
            await self._audit(
                session,
                report_id=report_id,
                agency_id=agency_id,
                user_id=user_id,
                user_email=user_email,
                action="access_denied",
                ip_address=ip_address,
                suspicious=True,
            )
            raise PermissionError("Insufficient role")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_viewed",
            ip_address=ip_address,
        )
        return _to_response(report, roles, user_id)

    async def update(
        self,
        session: AsyncSession,
        report_id: UUID,
        req: IncidentReportUpdateRequest,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
        autosave: bool = False,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        if not _can_write(roles, report, user_id):
            await self._audit(
                session,
                report_id=report_id,
                agency_id=agency_id,
                user_id=user_id,
                user_email=user_email,
                action="edit_denied",
                ip_address=ip_address,
                suspicious=True,
            )
            raise PermissionError("Report is read-only")

        if req.header:
            _apply_header(report, req.header)
        if req.narrative is not None and req.narrative != report.narrative:
            revisions = list(report.narrative_revisions or [])
            revisions.append(
                {
                    "content": report.narrative or "",
                    "author_id": str(user_id) if user_id else None,
                    "revision_type": "narrative",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            report.narrative_revisions = revisions
            report.narrative = req.narrative

        report.updated_by = user_id
        await incident_report_repository.update(session, report)

        if any(
            x is not None
            for x in (
                req.victims,
                req.suspects,
                req.vehicles,
                req.weapons,
                req.narcotics,
                req.property_items,
            )
        ):
            from app.cji_crypto import reveal_cji_fields

            authorized = _cji_authorized(roles)
            victims_data = (
                [v.model_dump() for v in req.victims]
                if req.victims is not None
                else [reveal_cji_fields(v.data, authorized) for v in sorted(report.victims, key=lambda x: x.sort_order)]
            )
            suspects_data = (
                [s.model_dump() for s in req.suspects]
                if req.suspects is not None
                else [
                    {**reveal_cji_fields(s.data, authorized), "is_unknown": s.is_unknown}
                    for s in sorted(report.suspects, key=lambda x: x.sort_order)
                ]
            )
            vehicles_data = (
                [v.model_dump() for v in req.vehicles]
                if req.vehicles is not None
                else [v.data for v in sorted(report.vehicles, key=lambda x: x.sort_order)]
            )
            weapons_data = (
                [w.model_dump() for w in req.weapons]
                if req.weapons is not None
                else [w.data for w in sorted(report.weapons, key=lambda x: x.sort_order)]
            )
            narcotics_data = (
                [n.model_dump() for n in req.narcotics]
                if req.narcotics is not None
                else [n.data for n in sorted(report.narcotics, key=lambda x: x.sort_order)]
            )
            property_data = (
                [p.model_dump() for p in req.property_items]
                if req.property_items is not None
                else [p.data for p in sorted(report.property_items, key=lambda x: x.sort_order)]
            )
            await incident_report_repository.sync_children(
                session,
                report,
                victims_data,
                suspects_data,
                vehicles_data,
                weapons_data,
                narcotics_data,
                property_data,
            )
            await session.commit()

        report = await incident_report_repository.get_full(session, report_id)
        assert report
        revs = await incident_report_repository.list_revisions(session, report_id)
        rev_num = (revs[0].revision_number + 1) if revs else 1
        snapshot = incident_report_repository.build_snapshot(report, _cji_authorized(roles))
        await incident_report_repository.add_revision(
            session,
            report_id,
            rev_num,
            snapshot,
            user_id,
            req.change_summary or ("Autosave" if autosave else "Report updated"),
        )
        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_autosaved" if autosave else "report_edited",
            ip_address=ip_address,
        )
        return _to_response(report, roles, user_id)

    async def finalize(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")
        if not _can_write(roles, report, user_id):
            raise PermissionError("Cannot finalize report")

        report.status = ReportStatus.PENDING_REVIEW.value
        report.finalized_at = datetime.now(timezone.utc)
        report.updated_by = user_id
        await incident_report_repository.update(session, report)
        report = await incident_report_repository.get_full(session, report_id)
        assert report
        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_finalized",
            ip_address=ip_address,
        )
        return _to_response(report, roles, user_id)

    async def approve(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        approved: bool,
        comment: str | None,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        if not _can_approve(roles):
            raise PermissionError("Supervisor approval required")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        if approved:
            report.status = ReportStatus.APPROVED.value
            report.approved_at = datetime.now(timezone.utc)
            report.approved_by = user_id
        else:
            report.status = ReportStatus.DRAFT.value

        if comment:
            comments = list(report.supervisor_comments or [])
            comments.append(
                {
                    "comment": comment,
                    "author_id": str(user_id) if user_id else None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            report.supervisor_comments = comments

        report.updated_by = user_id
        await incident_report_repository.update(session, report)
        report = await incident_report_repository.get_full(session, report_id)
        assert report
        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_approved" if approved else "report_rejected",
            ip_address=ip_address,
            details={"comment": comment},
        )
        return _to_response(report, roles, user_id)

    async def lock(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> IncidentReportResponse:
        roles = _parse_roles(roles_header)
        if not (roles & ADMIN_ROLES):
            raise PermissionError("Admin required to lock reports")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        report.locked = True
        report.status = ReportStatus.LOCKED.value
        report.updated_by = user_id
        await incident_report_repository.update(session, report)
        report = await incident_report_repository.get_full(session, report_id)
        assert report
        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_locked",
            ip_address=ip_address,
        )
        return _to_response(report, roles, user_id)

    async def search(
        self,
        session: AsyncSession,
        *,
        agency_id: UUID,
        q: str | None,
        status: str | None,
        incident_number: str | None,
        limit: int,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> list[IncidentReportSummary]:
        roles = _parse_roles(roles_header)
        if not _can_read(roles):
            raise PermissionError("Insufficient role")

        reports = await incident_report_repository.search(
            session, agency_id, q=q, status=status, incident_number=incident_number, limit=limit
        )
        await self._audit(
            session,
            report_id=None,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_search",
            ip_address=ip_address,
            details={"q": q, "count": len(reports)},
        )
        return [
            IncidentReportSummary(
                id=r.id,
                incident_number=r.incident_number,
                case_number=r.case_number,
                incident_type=r.incident_type,
                reporting_officer_name=r.reporting_officer_name,
                status=ReportStatus(r.status),
                report_date=r.report_date,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in reports
        ]

    async def audit_logs(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        roles_header: str,
    ) -> list[ReportAuditLogResponse]:
        roles = _parse_roles(roles_header)
        if not (roles & (APPROVE_ROLES | ADMIN_ROLES)):
            raise PermissionError("Supervisor or admin required")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        logs = await incident_report_repository.list_audit_logs(session, report_id)
        return [
            ReportAuditLogResponse(
                id=log.id,
                report_id=log.report_id,
                user_id=log.user_id,
                user_email=log.user_email,
                action=log.action,
                ip_address=log.ip_address,
                details=log.details,
                suspicious=log.suspicious,
                created_at=log.created_at,
            )
            for log in logs
        ]

    async def revisions(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        roles_header: str,
    ) -> list[ReportRevisionResponse]:
        roles = _parse_roles(roles_header)
        if not _can_read(roles):
            raise PermissionError("Insufficient role")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        revs = await incident_report_repository.list_revisions(session, report_id)
        return [
            ReportRevisionResponse(
                id=r.id,
                revision_number=r.revision_number,
                change_summary=r.change_summary,
                created_by=r.created_by,
                created_at=r.created_at,
            )
            for r in revs
        ]

    async def export_pdf(
        self,
        session: AsyncSession,
        report_id: UUID,
        *,
        agency_id: UUID,
        user_id: UUID | None,
        user_email: str | None,
        roles_header: str,
        ip_address: str | None,
    ) -> dict:
        roles = _parse_roles(roles_header)
        if not (roles & (WRITE_ROLES | {"analyst"})):
            raise PermissionError("Export not permitted")

        report = await incident_report_repository.get_full(session, report_id)
        if not report or report.agency_id != agency_id:
            raise ValueError("Report not found")

        await self._audit(
            session,
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action="report_exported",
            ip_address=ip_address,
            details={"format": "pdf"},
        )
        data = _to_response(report, roles, user_id)
        return {
            "format": "pdf",
            "report_id": str(report_id),
            "title": f"Incident Report {report.incident_number or report_id}",
            "content": data.model_dump(mode="json"),
            "message": "PDF generation stub — integrate wkhtmltopdf or reportlab in production",
        }


incident_report_service = IncidentReportService()
