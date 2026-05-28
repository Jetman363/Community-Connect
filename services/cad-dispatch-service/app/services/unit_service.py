import math
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.events import publish_cad_event
from app.models import AuditLog, Incident, IncidentEvent, Unit, UnitAssignment, UnitStatus
from app.schemas import UnitCreate, UnitRecommendation, UnitStatusUpdate


async def list_units(db: AsyncSession, agency_id: str) -> list[Unit]:
    result = await db.execute(
        select(Unit).where(Unit.agency_id == agency_id).order_by(Unit.call_sign)
    )
    return list(result.scalars().all())


async def create_unit(db: AsyncSession, payload: UnitCreate, actor_id: str) -> Unit:
    unit = Unit(
        agency_id=payload.agency_id,
        call_sign=payload.call_sign,
        unit_type=payload.unit_type,
        officer_ids=payload.officer_ids,
        officer_names=payload.officer_names,
        vehicle_id=payload.vehicle_id,
    )
    db.add(unit)
    db.add(
        AuditLog(
            agency_id=payload.agency_id,
            actor_id=actor_id,
            action="unit.create",
            resource_type="unit",
            resource_id=str(unit.id),
        )
    )
    await db.commit()
    await db.refresh(unit)
    await publish_cad_event("unit.created", payload.agency_id, {"unit_id": str(unit.id), "call_sign": unit.call_sign})
    return unit


async def _active_assignments(
    db: AsyncSession, unit_id: uuid.UUID, incident_id: uuid.UUID
) -> list[UnitAssignment]:
    result = await db.execute(
        select(UnitAssignment)
        .where(
            UnitAssignment.unit_id == unit_id,
            UnitAssignment.incident_id == incident_id,
            UnitAssignment.cleared_at.is_(None),
        )
        .order_by(UnitAssignment.assigned_at.desc())
    )
    return list(result.scalars().all())


def _clear_assignments(assignments: list[UnitAssignment], when: datetime | None = None) -> None:
    cleared = when or datetime.now(UTC)
    for assignment in assignments:
        assignment.cleared_at = cleared


async def update_unit_status(
    db: AsyncSession, unit: Unit, payload: UnitStatusUpdate, actor_id: str
) -> Unit:
    incident: Incident | None = None
    assignments: list[UnitAssignment] = []
    if payload.incident_id:
        incident = await db.get(Incident, payload.incident_id)
        if incident:
            assignments = await _active_assignments(db, unit.id, payload.incident_id)

    if payload.require_report and incident:
        unit.status = UnitStatus.AVAILABLE.value
        _clear_assignments(assignments)
        incident.status = "pending_report"
        db.add(
            IncidentEvent(
                incident_id=incident.id,
                event_type="unit.10-8",
                description=f"Unit {unit.call_sign} 10-8 — report required",
                actor_id=actor_id,
                metadata_json={"unit_id": str(unit.id), "require_report": True},
            )
        )
    elif payload.release_from_call and assignments:
        unit.status = payload.status.value
        _clear_assignments(assignments)
        if incident:
            db.add(
                IncidentEvent(
                    incident_id=incident.id,
                    event_type="unit.released",
                    description=f"Dispatcher released unit {unit.call_sign} from call",
                    actor_id=actor_id,
                    metadata_json={"unit_id": str(unit.id)},
                )
            )
    elif (
        payload.status.value == UnitStatus.AVAILABLE.value
        and assignments
        and not payload.require_report
    ):
        unit.status = UnitStatus.AVAILABLE.value
        _clear_assignments(assignments)
        if incident:
            db.add(
                IncidentEvent(
                    incident_id=incident.id,
                    event_type="unit.10-8",
                    description=f"Unit {unit.call_sign} 10-8 — no case report required",
                    actor_id=actor_id,
                    metadata_json={"unit_id": str(unit.id), "require_report": False},
                )
            )
    else:
        unit.status = payload.status.value
        if incident and assignments:
            if payload.status.value == UnitStatus.CLEAR.value:
                db.add(
                    IncidentEvent(
                        incident_id=incident.id,
                        event_type="unit.clear",
                        description=f"Unit {unit.call_sign} clear from scene",
                        actor_id=actor_id,
                        metadata_json={"unit_id": str(unit.id)},
                    )
                )
            elif payload.status.value == UnitStatus.ON_SCENE.value and incident.status == "dispatched":
                incident.status = "active"
            elif payload.status.value == UnitStatus.EN_ROUTE.value and incident.status == "pending":
                incident.status = "dispatched"
                incident.dispatched_at = datetime.now(UTC)

    unit.last_status_change = datetime.now(UTC)
    if payload.latitude is not None:
        unit.latitude = payload.latitude
    if payload.longitude is not None:
        unit.longitude = payload.longitude
    if payload.heading is not None:
        unit.heading = payload.heading
    if payload.speed_mph is not None:
        unit.speed_mph = payload.speed_mph
    db.add(
        AuditLog(
            agency_id=unit.agency_id,
            actor_id=actor_id,
            action="unit.status_change",
            resource_type="unit",
            resource_id=str(unit.id),
            details={
                "status": unit.status,
                "incident_id": str(payload.incident_id) if payload.incident_id else None,
                "require_report": payload.require_report,
                "release_from_call": payload.release_from_call,
            },
        )
    )
    await db.commit()
    await db.refresh(unit)
    event_type = "unit.emergency" if payload.status.value == "emergency" else "unit.status"
    await publish_cad_event(
        event_type,
        unit.agency_id,
        {
            "unit_id": str(unit.id),
            "call_sign": unit.call_sign,
            "status": unit.status,
            "incident_id": str(payload.incident_id) if payload.incident_id else None,
            "require_report": payload.require_report,
        },
    )
    return unit


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


async def recommend_units(
    db: AsyncSession,
    agency_id: str,
    incident_lat: float | None,
    incident_lon: float | None,
    incident_type: str,
    limit: int = 5,
) -> list[UnitRecommendation]:
    units = await list_units(db, agency_id)
    available = [u for u in units if u.status in ("available", "clear")]
    recommendations: list[UnitRecommendation] = []
    for unit in available:
        score = 50.0
        reason_parts = ["Available"]
        distance = None
        if incident_lat and incident_lon and unit.latitude and unit.longitude:
            distance = haversine_miles(incident_lat, incident_lon, unit.latitude, unit.longitude)
            score += max(0, 40 - distance * 4)
            reason_parts.append(f"{distance:.1f} mi")
        if incident_type in ("medical", "fire") and unit.unit_type in ("ems", "fire"):
            score += 20
            reason_parts.append("Specialty match")
        elif incident_type in ("traffic", "dwI", "pursuit") and unit.unit_type == "patrol":
            score += 15
            reason_parts.append("Patrol unit")
        eta = (distance / 0.75) if distance else None
        recommendations.append(
            UnitRecommendation(
                unit_id=unit.id,
                call_sign=unit.call_sign,
                score=round(score, 1),
                reason=", ".join(reason_parts),
                distance_miles=round(distance, 2) if distance else None,
                eta_minutes=round(eta, 1) if eta else None,
            )
        )
    recommendations.sort(key=lambda r: r.score, reverse=True)
    return recommendations[:limit]
