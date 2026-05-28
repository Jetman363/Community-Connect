from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IdempotencyRecord, Incident, OutboxEvent, Report


class IncidentRepository:
    async def create(self, session: AsyncSession, **fields) -> Incident:
        incident = Incident(id=uuid4(), **fields)
        session.add(incident)
        await session.commit()
        await session.refresh(incident)
        return incident

    async def get_by_id(self, session: AsyncSession, incident_id: UUID) -> Incident | None:
        res = await session.execute(select(Incident).where(Incident.id == incident_id))
        return res.scalar_one_or_none()

    async def list_by_agency(self, session: AsyncSession, agency_id: UUID, limit: int = 50) -> list[Incident]:
        stmt = (
            select(Incident)
            .where(Incident.agency_id == agency_id)
            .order_by(Incident.created_at.desc())
            .limit(limit)
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def update(self, session: AsyncSession, incident: Incident, **fields) -> Incident:
        for key, value in fields.items():
            if value is not None:
                setattr(incident, key, value)
        await session.commit()
        await session.refresh(incident)
        return incident


class ReportRepository:
    async def create(self, session: AsyncSession, **fields) -> Report:
        report = Report(id=uuid4(), **fields)
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report

    async def get_by_id(self, session: AsyncSession, report_id: UUID) -> Report | None:
        res = await session.execute(select(Report).where(Report.id == report_id))
        return res.scalar_one_or_none()

    async def list_by_incident(self, session: AsyncSession, incident_id: UUID) -> list[Report]:
        stmt = select(Report).where(Report.incident_id == incident_id).order_by(Report.created_at.desc())
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def update(self, session: AsyncSession, report: Report, **fields) -> Report:
        for key, value in fields.items():
            if value is not None:
                setattr(report, key, value)
        await session.commit()
        await session.refresh(report)
        return report

    async def get_idempotency(self, session: AsyncSession, key: str) -> IdempotencyRecord | None:
        res = await session.execute(select(IdempotencyRecord).where(IdempotencyRecord.idempotency_key == key))
        return res.scalar_one_or_none()

    async def save_idempotency(self, session: AsyncSession, key: str, response_json: dict) -> None:
        session.add(
            IdempotencyRecord(
                idempotency_key=key,
                response_json=response_json,
                created_at=datetime.now(timezone.utc),
            )
        )
        await session.commit()

    async def append_outbox(self, session: AsyncSession, topic: str, payload: dict) -> OutboxEvent:
        evt = OutboxEvent(topic=topic, payload=payload, dispatched=False)
        session.add(evt)
        await session.commit()
        await session.refresh(evt)
        return evt

    async def get_pending_outbox(self, session: AsyncSession) -> list[OutboxEvent]:
        stmt = select(OutboxEvent).where(OutboxEvent.dispatched.is_(False)).order_by(OutboxEvent.id.asc())
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def mark_outbox_dispatched(self, session: AsyncSession, event_id: int) -> OutboxEvent | None:
        res = await session.execute(select(OutboxEvent).where(OutboxEvent.id == event_id))
        evt = res.scalar_one_or_none()
        if not evt:
            return None
        evt.dispatched = True
        evt.dispatched_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(evt)
        return evt


incident_repository = IncidentRepository()
report_repository = ReportRepository()
