"""Repository for structured incident reports."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.cji_crypto import protect_cji_fields, reveal_cji_fields
from app.models import (
    IncidentReport,
    ReportAuditLog,
    ReportNarcotic,
    ReportProperty,
    ReportRevision,
    ReportSuspect,
    ReportVehicle,
    ReportVictim,
    ReportWeapon,
)


def _encrypt_entry(data: dict) -> dict:
    return protect_cji_fields(data)


def _decrypt_entry(data: dict, authorized: bool) -> dict:
    return reveal_cji_fields(data, authorized)


class IncidentReportRepository:
    async def create(self, session: AsyncSession, **fields) -> IncidentReport:
        report = IncidentReport(id=uuid4(), **fields)
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report

    async def get_full(self, session: AsyncSession, report_id: UUID) -> IncidentReport | None:
        stmt = (
            select(IncidentReport)
            .where(IncidentReport.id == report_id)
            .options(
                selectinload(IncidentReport.victims),
                selectinload(IncidentReport.suspects),
                selectinload(IncidentReport.vehicles),
                selectinload(IncidentReport.weapons),
                selectinload(IncidentReport.narcotics),
                selectinload(IncidentReport.property_items),
            )
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def search(
        self,
        session: AsyncSession,
        agency_id: UUID,
        q: str | None = None,
        status: str | None = None,
        incident_number: str | None = None,
        limit: int = 50,
    ) -> list[IncidentReport]:
        stmt = select(IncidentReport).where(IncidentReport.agency_id == agency_id)
        if status:
            stmt = stmt.where(IncidentReport.status == status)
        if incident_number:
            stmt = stmt.where(IncidentReport.incident_number.ilike(f"%{incident_number}%"))
        if q:
            pattern = f"%{q}%"
            stmt = stmt.where(
                or_(
                    IncidentReport.incident_number.ilike(pattern),
                    IncidentReport.case_number.ilike(pattern),
                    IncidentReport.incident_type.ilike(pattern),
                    IncidentReport.reporting_officer_name.ilike(pattern),
                    IncidentReport.incident_location.ilike(pattern),
                )
            )
        stmt = stmt.order_by(IncidentReport.updated_at.desc()).limit(limit)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def sync_children(
        self,
        session: AsyncSession,
        report: IncidentReport,
        victims: list[dict],
        suspects: list[dict],
        vehicles: list[dict],
        weapons: list[dict],
        narcotics: list[dict],
        property_items: list[dict],
    ) -> None:
        report_id = report.id
        await session.execute(delete(ReportVictim).where(ReportVictim.report_id == report_id))
        await session.execute(delete(ReportSuspect).where(ReportSuspect.report_id == report_id))
        await session.execute(delete(ReportVehicle).where(ReportVehicle.report_id == report_id))
        await session.execute(delete(ReportWeapon).where(ReportWeapon.report_id == report_id))
        await session.execute(delete(ReportNarcotic).where(ReportNarcotic.report_id == report_id))
        await session.execute(delete(ReportProperty).where(ReportProperty.report_id == report_id))

        for i, v in enumerate(victims):
            session.add(
                ReportVictim(
                    id=uuid4(),
                    report_id=report.id,
                    role=v.get("role", "victim"),
                    data=_encrypt_entry(v),
                    sort_order=i,
                )
            )
        for i, s in enumerate(suspects):
            session.add(
                ReportSuspect(
                    id=uuid4(),
                    report_id=report.id,
                    is_unknown=s.get("is_unknown", False),
                    data=_encrypt_entry(s),
                    sort_order=i,
                )
            )
        for i, v in enumerate(vehicles):
            session.add(ReportVehicle(id=uuid4(), report_id=report.id, data=v, sort_order=i))
        for i, w in enumerate(weapons):
            session.add(ReportWeapon(id=uuid4(), report_id=report.id, data=w, sort_order=i))
        for i, n in enumerate(narcotics):
            session.add(ReportNarcotic(id=uuid4(), report_id=report.id, data=n, sort_order=i))
        for i, p in enumerate(property_items):
            session.add(ReportProperty(id=uuid4(), report_id=report.id, data=p, sort_order=i))

    async def update(self, session: AsyncSession, report: IncidentReport, **fields) -> IncidentReport:
        for key, value in fields.items():
            if value is not None:
                setattr(report, key, value)
        report.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(report)
        return report

    async def add_revision(
        self,
        session: AsyncSession,
        report_id: UUID,
        revision_number: int,
        snapshot: dict,
        created_by: UUID | None,
        change_summary: str | None,
    ) -> ReportRevision:
        rev = ReportRevision(
            id=uuid4(),
            report_id=report_id,
            revision_number=revision_number,
            snapshot=snapshot,
            created_by=created_by,
            change_summary=change_summary,
        )
        session.add(rev)
        await session.commit()
        await session.refresh(rev)
        return rev

    async def list_revisions(self, session: AsyncSession, report_id: UUID) -> list[ReportRevision]:
        stmt = (
            select(ReportRevision)
            .where(ReportRevision.report_id == report_id)
            .order_by(ReportRevision.revision_number.desc())
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def log_audit(
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
    ) -> ReportAuditLog:
        entry = ReportAuditLog(
            report_id=report_id,
            agency_id=agency_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            ip_address=ip_address,
            details=details,
            suspicious=suspicious,
        )
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
        return entry

    async def list_audit_logs(self, session: AsyncSession, report_id: UUID, limit: int = 100) -> list[ReportAuditLog]:
        stmt = (
            select(ReportAuditLog)
            .where(ReportAuditLog.report_id == report_id)
            .order_by(ReportAuditLog.created_at.desc())
            .limit(limit)
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    def build_snapshot(self, report: IncidentReport, authorized: bool) -> dict:
        return {
            "header": {
                "incident_number": report.incident_number,
                "case_number": report.case_number,
                "report_date": report.report_date,
                "report_time": report.report_time,
                "reporting_officer_name": report.reporting_officer_name,
                "incident_location": report.incident_location,
                "incident_type": report.incident_type,
            },
            "narrative": report.narrative,
            "status": report.status,
            "victims": [_decrypt_entry(v.data, authorized) for v in sorted(report.victims, key=lambda x: x.sort_order)],
            "suspects": [_decrypt_entry(s.data, authorized) for s in sorted(report.suspects, key=lambda x: x.sort_order)],
            "vehicles": [v.data for v in sorted(report.vehicles, key=lambda x: x.sort_order)],
            "weapons": [w.data for w in sorted(report.weapons, key=lambda x: x.sort_order)],
            "narcotics": [n.data for n in sorted(report.narcotics, key=lambda x: x.sort_order)],
            "property_items": [p.data for p in sorted(report.property_items, key=lambda x: x.sort_order)],
        }


incident_report_repository = IncidentReportRepository()
