import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.events import publish_cad_event
from app.models import AuditLog, Incident, IncidentEvent, OfficerRemark, Unit, UnitAssignment
from app.schemas import AssignUnitRequest, IncidentCreate, IncidentUpdate, RemarkCreate, UnitStatus


async def next_incident_number(db: AsyncSession, agency_id: str) -> str:
    year = datetime.now(UTC).year
    prefix = f"{year}-"
    result = await db.execute(
        select(Incident.incident_number).where(
            Incident.agency_id == agency_id,
            Incident.incident_number.like(f"{prefix}%"),
        )
    )
    max_seq = 0
    for (number,) in result.all():
        try:
            max_seq = max(max_seq, int(number.split("-")[-1]))
        except ValueError:
            continue
    return f"{year}-{max_seq + 1:06d}"


async def log_audit(
    db: AsyncSession,
    *,
    agency_id: str,
    actor_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            agency_id=agency_id,
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
        )
    )


async def create_incident(db: AsyncSession, payload: IncidentCreate, actor_id: str) -> Incident:
    incident = Incident(
        agency_id=payload.agency_id,
        incident_number=await next_incident_number(db, payload.agency_id),
        nature=payload.nature,
        incident_type=payload.incident_type,
        priority=payload.priority.value,
        dispatch_code=payload.dispatch_code,
        caller_name=payload.caller_name,
        caller_phone=payload.caller_phone,
        location=payload.location,
        apartment=payload.apartment,
        cross_streets=payload.cross_streets,
        latitude=payload.latitude,
        longitude=payload.longitude,
        notes=payload.notes,
        narrative=payload.narrative,
        hazardous=payload.hazardous,
        weapons_involved=payload.weapons_involved,
        injuries=payload.injuries,
        metadata_json=payload.metadata,
        status="pending",
    )
    db.add(incident)
    await db.flush()
    db.add(
        IncidentEvent(
            incident_id=incident.id,
            event_type="incident.created",
            description=f"Incident {incident.incident_number} created",
            actor_id=actor_id,
        )
    )
    await log_audit(
        db,
        agency_id=payload.agency_id,
        actor_id=actor_id,
        action="incident.create",
        resource_type="incident",
        resource_id=str(incident.id),
    )
    await db.commit()
    await db.refresh(incident)
    await publish_cad_event("incident.created", payload.agency_id, {"incident_id": str(incident.id)})
    return incident


async def get_incident(db: AsyncSession, incident_id: uuid.UUID) -> Incident | None:
    result = await db.execute(
        select(Incident)
        .options(
            selectinload(Incident.assignments).selectinload(UnitAssignment.unit),
            selectinload(Incident.remarks),
        )
        .where(Incident.id == incident_id)
    )
    return result.scalar_one_or_none()


async def list_incidents(
    db: AsyncSession, agency_id: str, status: str | None = None, limit: int = 100
) -> list[Incident]:
    query = (
        select(Incident)
        .options(
            selectinload(Incident.assignments).selectinload(UnitAssignment.unit),
            selectinload(Incident.remarks),
        )
        .where(Incident.agency_id == agency_id)
        .order_by(Incident.created_at.desc())
        .limit(limit)
    )
    if status:
        query = query.where(Incident.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_incident(
    db: AsyncSession, incident: Incident, payload: IncidentUpdate, actor_id: str
) -> Incident:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "priority" and value is not None:
            setattr(incident, "priority", value.value if hasattr(value, "value") else value)
        else:
            setattr(incident, field, value)
    db.add(
        IncidentEvent(
            incident_id=incident.id,
            event_type="incident.updated",
            description="Incident updated",
            actor_id=actor_id,
        )
    )
    await log_audit(
        db,
        agency_id=incident.agency_id,
        actor_id=actor_id,
        action="incident.update",
        resource_type="incident",
        resource_id=str(incident.id),
        details=payload.model_dump(exclude_unset=True),
    )
    await db.commit()
    await db.refresh(incident)
    await publish_cad_event("incident.updated", incident.agency_id, {"incident_id": str(incident.id)})
    return incident


async def assign_unit(
    db: AsyncSession, incident: Incident, req: AssignUnitRequest, actor_id: str
) -> UnitAssignment:
    unit = await db.get(Unit, req.unit_id)
    if not unit:
        raise ValueError("Unit not found")

    existing = await db.execute(
        select(UnitAssignment)
        .where(
            UnitAssignment.incident_id == incident.id,
            UnitAssignment.unit_id == req.unit_id,
            UnitAssignment.cleared_at.is_(None),
        )
        .order_by(UnitAssignment.assigned_at.desc())
    )
    prior = existing.scalars().first()
    if prior:
        unit.status = UnitStatus.EN_ROUTE.value
        unit.last_status_change = datetime.now(UTC)
        incident.status = "dispatched"
        incident.dispatched_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(prior)
        return prior

    assignment = UnitAssignment(incident_id=incident.id, unit_id=req.unit_id, is_primary=req.is_primary)
    incident.status = "dispatched"
    incident.dispatched_at = datetime.now(UTC)
    unit.status = UnitStatus.EN_ROUTE.value
    unit.last_status_change = datetime.now(UTC)
    db.add(assignment)
    db.add(
        IncidentEvent(
            incident_id=incident.id,
            event_type="unit.assigned",
            description=f"Unit {unit.call_sign} assigned",
            actor_id=actor_id,
            metadata_json={"unit_id": str(unit.id)},
        )
    )
    await log_audit(
        db,
        agency_id=incident.agency_id,
        actor_id=actor_id,
        action="unit.assign",
        resource_type="incident",
        resource_id=str(incident.id),
        details={"unit_id": str(req.unit_id)},
    )
    await db.commit()
    await db.refresh(assignment)
    await publish_cad_event(
        "unit.assigned",
        incident.agency_id,
        {"incident_id": str(incident.id), "unit_id": str(unit.id), "call_sign": unit.call_sign},
    )
    return assignment


async def add_remark(db: AsyncSession, incident: Incident, payload: RemarkCreate) -> OfficerRemark:
    remark = OfficerRemark(
        incident_id=incident.id,
        officer_id=payload.officer_id,
        officer_name=payload.officer_name,
        remark=payload.remark,
    )
    db.add(remark)
    await db.commit()
    await db.refresh(remark)
    await publish_cad_event(
        "incident.remark",
        incident.agency_id,
        {"incident_id": str(incident.id), "remark_id": str(remark.id)},
    )
    return remark


async def next_case_number(db: AsyncSession, agency_id: str) -> str:
    year = datetime.now(UTC).year
    prefix = f"CASE-{year}-"
    result = await db.execute(select(Incident).where(Incident.agency_id == agency_id))
    max_seq = 0
    for inc in result.scalars().all():
        meta = inc.metadata_json or {}
        case_num = meta.get("case_number", "")
        if isinstance(case_num, str) and case_num.startswith(prefix):
            try:
                max_seq = max(max_seq, int(case_num.rsplit("-", 1)[-1]))
            except ValueError:
                continue
    return f"{prefix}{max_seq + 1:06d}"


async def create_case_number(db: AsyncSession, incident: Incident, actor_id: str) -> tuple[Incident, str]:
    meta = dict(incident.metadata_json or {})
    if meta.get("case_number"):
        raise ValueError("Case number already exists for this incident")

    case_number = await next_case_number(db, incident.agency_id)
    meta["case_number"] = case_number
    meta["report_required"] = True
    meta["case_created_at"] = datetime.now(UTC).isoformat()
    meta["case_created_by"] = actor_id
    incident.metadata_json = meta

    db.add(
        IncidentEvent(
            incident_id=incident.id,
            event_type="case.created",
            description=f"RMS case {case_number} opened for incident {incident.incident_number}",
            actor_id=actor_id,
            metadata_json={"case_number": case_number, "incident_number": incident.incident_number},
        )
    )
    await log_audit(
        db,
        agency_id=incident.agency_id,
        actor_id=actor_id,
        action="incident.create_case",
        resource_type="incident",
        resource_id=str(incident.id),
        details={"case_number": case_number},
    )
    await db.commit()
    await db.refresh(incident)
    await publish_cad_event(
        "case.created",
        incident.agency_id,
        {"incident_id": str(incident.id), "case_number": case_number, "incident_number": incident.incident_number},
    )
    return incident, case_number
