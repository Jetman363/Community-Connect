from datetime import UTC, datetime, timedelta

from sqlalchemy import text, select

from app.db import SessionLocal
from app.models import BoloAlert, Incident, Unit, UnitAssignment, WarrantFlag


async def seed_demo_data() -> None:
    agency_id = "agency-demo-001"
    async with SessionLocal() as db:
        existing = await db.scalar(text("SELECT COUNT(*) FROM units"))
        if existing and existing > 0:
            await _ensure_supervisor_units(db, agency_id)
            return

        units_data = [
            ("1A12", "patrol", ["Officer Smith"], 29.4241, -98.4936),
            ("2B07", "patrol", ["Officer Garcia"], 29.4251, -98.4926),
            ("EMS-3", "ems", ["Medic Torres"], 29.4231, -98.4946),
            ("K9-1", "k9", ["Officer Chen"], 29.4261, -98.4916),
            ("SUP-1", "supervisor", ["Sgt. Martinez"], 29.4246, -98.4931),
            ("SUP-2", "supervisor", ["Lt. Thompson"], 29.4256, -98.4921),
            ("SUP-3", "supervisor", ["Capt. Rivera"], 29.4236, -98.4941),
        ]
        for call_sign, unit_type, officers, lat, lng in units_data:
            db.add(
                Unit(
                    agency_id=agency_id,
                    call_sign=call_sign,
                    unit_type=unit_type,
                    officer_names=officers,
                    latitude=lat,
                    longitude=lng,
                    status="available",
                )
            )

        incidents_data = [
            ("2026-000001", "P4", "Disturbance — loud music complaint", "disturbance", "pending",
             "1420 Oak Street", "Oak / 14th", 29.4261, -98.4916, "Third complaint this week", None),
            ("2026-000002", "P2", "Traffic stop — possible DWI", "traffic", "dispatched",
             "Highway 281 near Evans Road", "281 / Evans", 29.5180, -98.4520,
             None, "White Ford F-150 northbound, erratic driving"),
            ("2026-000003", "P1", "Medical emergency — chest pain", "medical", "pending",
             "8901 Medical Drive Apt 4B", None, 29.4100, -98.5000, None, None),
        ]
        for num, prio, nature, itype, status, loc, cross, lat, lng, notes, narrative in incidents_data:
            db.add(
                Incident(
                    agency_id=agency_id,
                    incident_number=num,
                    priority=prio,
                    nature=nature,
                    incident_type=itype,
                    status=status,
                    location=loc,
                    cross_streets=cross,
                    latitude=lat,
                    longitude=lng,
                    notes=notes,
                    narrative=narrative,
                    injuries=itype == "medical",
                    caller_phone="210-555-0142" if itype == "medical" else None,
                )
            )

        db.add(BoloAlert(
            agency_id=agency_id, title="Armed Robbery Suspect",
            description="Male, 6ft, black hoodie, armed with handgun.",
            subject_type="person", priority="P1",
            expires_at=datetime.now(UTC) + timedelta(days=3),
        ))
        db.add(BoloAlert(
            agency_id=agency_id, title="Stolen Vehicle",
            description="White Ford F-150, TX plate ABC-1234, VIN 1FTFW1ET5DFC12345",
            subject_type="vehicle", plate="ABC-1234", priority="P2",
        ))
        db.add(WarrantFlag(
            agency_id=agency_id, subject_name="John Doe", warrant_type="felony",
            case_number="WF-2026-0042", location_hint="2200 Block Elm St",
        ))
        await db.commit()

        unit_result = await db.execute(select(Unit).where(Unit.call_sign == "1A12"))
        inc_result = await db.execute(select(Incident).where(Incident.incident_number == "2026-000002"))
        unit_1a12 = unit_result.scalar_one_or_none()
        traffic_inc = inc_result.scalar_one_or_none()
        if unit_1a12 and traffic_inc:
            unit_1a12.status = "en_route"
            db.add(
                UnitAssignment(
                    incident_id=traffic_inc.id,
                    unit_id=unit_1a12.id,
                    is_primary=True,
                )
            )
            traffic_inc.dispatched_at = datetime.now(UTC)
            await db.commit()


async def _ensure_supervisor_units(db, agency_id: str) -> None:
    """Add supervisor units when upgrading an existing demo database."""
    supervisor_units = [
        ("SUP-1", "supervisor", ["Sgt. Martinez"], 29.4246, -98.4931),
        ("SUP-2", "supervisor", ["Lt. Thompson"], 29.4256, -98.4921),
        ("SUP-3", "supervisor", ["Capt. Rivera"], 29.4236, -98.4941),
    ]
    result = await db.execute(select(Unit.call_sign).where(Unit.agency_id == agency_id))
    existing_signs = {row[0] for row in result.all()}
    added = False
    for call_sign, unit_type, officers, lat, lng in supervisor_units:
        if call_sign in existing_signs:
            continue
        db.add(
            Unit(
                agency_id=agency_id,
                call_sign=call_sign,
                unit_type=unit_type,
                officer_names=officers,
                latitude=lat,
                longitude=lng,
                status="available",
            )
        )
        added = True
    if added:
        await db.commit()
