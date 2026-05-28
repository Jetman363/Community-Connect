import re
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import BoloAlert, WarrantFlag

router = APIRouter(prefix="/ncic", tags=["ncic"])


def _norm_plate(plate: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", plate.upper())


def _norm_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip().upper())


class VehicleQuery(BaseModel):
    agency_id: str
    plate: str | None = Field(default=None, max_length=16)
    state: str = Field(default="TX", min_length=2, max_length=2)
    vin: str | None = Field(default=None, max_length=17, description="Vehicle Identification Number")


# Demo VINs linked to stolen vehicle BOLO (White Ford F-150)
_DEMO_VIN_INDEX: set[str] = {
    "1FTFW1ET5DFC12345",
}


def _norm_vin(vin: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", vin.upper())


class PersonQuery(BaseModel):
    agency_id: str
    last_name: str | None = Field(default=None, max_length=64)
    first_name: str | None = Field(default=None, max_length=64)
    dob: str | None = Field(default=None, max_length=16)
    dl_number: str | None = Field(default=None, max_length=32)
    sid: str | None = Field(default=None, max_length=32, description="State ID (SID) number")
    address: str | None = Field(default=None, max_length=256)


# Demo SID → subject mapping (TCIC state identification numbers)
_DEMO_SID_INDEX: dict[str, str] = {
    "TX01234567": "JOHN DOE",
    "01234567": "JOHN DOE",
}


def _norm_sid(sid: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", sid.upper())


def _norm_address(addr: str) -> str:
    return re.sub(r"\s+", " ", addr.strip().upper())


def _hit_key(hit: dict) -> str:
    return f"{hit.get('type')}:{hit.get('subject_name') or hit.get('title')}:{hit.get('case_number') or hit.get('sid')}"


def _append_hit(hits: list[dict], seen: set[str], hit: dict) -> None:
    key = _hit_key(hit)
    if key not in seen:
        seen.add(key)
        hits.append(hit)


def _vehicle_hit_key(hit: dict) -> str:
    return f"{hit.get('type')}:{hit.get('plate')}:{hit.get('vin')}"


def _append_vehicle_hit(hits: list[dict], seen: set[str], hit: dict) -> None:
    key = _vehicle_hit_key(hit)
    if key not in seen:
        seen.add(key)
        hits.append(hit)


@router.post("/vehicle")
async def query_vehicle(payload: VehicleQuery, db: AsyncSession = Depends(get_db)) -> dict:
    if not payload.plate and not payload.vin:
        return {
            "query_id": str(uuid.uuid4()),
            "query_type": "vehicle",
            "status": "error",
            "hits": [],
            "message": "Enter license plate or VIN to query",
            "queried_at": datetime.now(UTC).isoformat(),
        }

    plate = _norm_plate(payload.plate) if payload.plate else None
    vin = _norm_vin(payload.vin) if payload.vin else None

    result = await db.execute(
        select(BoloAlert).where(
            BoloAlert.agency_id == payload.agency_id,
            BoloAlert.active.is_(True),
            BoloAlert.subject_type == "vehicle",
        )
    )
    bolos = list(result.scalars().all())
    hits: list[dict] = []
    seen: set[str] = set()

    for bolo in bolos:
        bolo_plate = _norm_plate(bolo.plate or "")
        if plate and bolo_plate and bolo_plate == plate:
            _append_vehicle_hit(hits, seen, {
                "type": "STOLEN_VEHICLE",
                "source": "NCIC/TCIC",
                "title": bolo.title,
                "description": bolo.description,
                "priority": bolo.priority,
                "plate": bolo.plate,
                "match_reason": f"Plate {payload.plate.upper()}",
            })

    if vin:
        if vin in _DEMO_VIN_INDEX:
            for bolo in bolos:
                _append_vehicle_hit(hits, seen, {
                    "type": "STOLEN_VEHICLE",
                    "source": "NCIC/TCIC",
                    "title": bolo.title,
                    "description": bolo.description,
                    "priority": bolo.priority,
                    "plate": bolo.plate,
                    "vin": payload.vin.upper(),
                    "match_reason": f"VIN {payload.vin.upper()}",
                })
        else:
            for bolo in bolos:
                desc = (bolo.description or "").upper()
                if vin in desc.replace("-", "").replace(" ", ""):
                    _append_vehicle_hit(hits, seen, {
                        "type": "STOLEN_VEHICLE",
                        "source": "NCIC/TCIC",
                        "title": bolo.title,
                        "description": bolo.description,
                        "priority": bolo.priority,
                        "plate": bolo.plate,
                        "vin": payload.vin.upper(),
                        "match_reason": f"VIN {payload.vin.upper()}",
                    })

    status = "hit" if hits else "clear"
    return {
        "query_id": str(uuid.uuid4()),
        "query_type": "vehicle",
        "status": status,
        "plate": payload.plate.upper() if payload.plate else None,
        "state": payload.state.upper(),
        "vin": payload.vin.upper() if payload.vin else None,
        "hits": hits,
        "message": f"{'HIT — ' + str(len(hits)) + ' record(s)' if hits else 'NO RECORD'} — NCIC/TCIC vehicle query",
        "queried_at": datetime.now(UTC).isoformat(),
    }


@router.post("/person")
async def query_person(payload: PersonQuery, db: AsyncSession = Depends(get_db)) -> dict:
    if not any([payload.last_name, payload.sid, payload.address]):
        return {
            "query_id": str(uuid.uuid4()),
            "query_type": "person",
            "status": "error",
            "hits": [],
            "message": "Enter last name, SID, or address to query",
            "queried_at": datetime.now(UTC).isoformat(),
        }

    last = _norm_name(payload.last_name) if payload.last_name else None
    first = _norm_name(payload.first_name) if payload.first_name else None
    full = f"{first} {last}".strip() if first and last else (last or first or "")
    sid = _norm_sid(payload.sid) if payload.sid else None
    address = _norm_address(payload.address) if payload.address else None

    warrant_result = await db.execute(
        select(WarrantFlag).where(
            WarrantFlag.agency_id == payload.agency_id,
            WarrantFlag.active.is_(True),
        )
    )
    warrants = list(warrant_result.scalars().all())

    bolo_result = await db.execute(
        select(BoloAlert).where(
            BoloAlert.agency_id == payload.agency_id,
            BoloAlert.active.is_(True),
            BoloAlert.subject_type == "person",
        )
    )
    bolos = list(bolo_result.scalars().all())

    hits: list[dict] = []
    seen: set[str] = set()

    if sid:
        sid_subject = _DEMO_SID_INDEX.get(sid)
        if sid_subject:
            for warrant in warrants:
                if _norm_name(warrant.subject_name) == sid_subject:
                    _append_hit(hits, seen, {
                        "type": "WARRANT",
                        "source": "TCIC",
                        "subject_name": warrant.subject_name,
                        "warrant_type": warrant.warrant_type,
                        "case_number": warrant.case_number,
                        "location_hint": warrant.location_hint,
                        "sid": payload.sid.upper(),
                        "match_reason": f"SID {payload.sid.upper()}",
                    })
        elif sid in {_norm_sid(c) for c in ("WF-2026-0042",)}:
            for warrant in warrants:
                if warrant.case_number and _norm_sid(warrant.case_number) == sid:
                    _append_hit(hits, seen, {
                        "type": "WARRANT",
                        "source": "TCIC",
                        "subject_name": warrant.subject_name,
                        "warrant_type": warrant.warrant_type,
                        "case_number": warrant.case_number,
                        "location_hint": warrant.location_hint,
                        "sid": payload.sid.upper(),
                        "match_reason": f"SID {payload.sid.upper()}",
                    })

    if address:
        for warrant in warrants:
            hint = _norm_address(warrant.location_hint or "")
            if hint and (address in hint or hint in address or _address_tokens_match(address, hint)):
                _append_hit(hits, seen, {
                    "type": "WARRANT",
                    "source": "TCIC",
                    "subject_name": warrant.subject_name,
                    "warrant_type": warrant.warrant_type,
                    "case_number": warrant.case_number,
                    "location_hint": warrant.location_hint,
                    "match_reason": f"Address near {warrant.location_hint}",
                })
        for bolo in bolos:
            desc = _norm_address(bolo.description)
            if address in desc or _address_tokens_match(address, desc):
                _append_hit(hits, seen, {
                    "type": "BOLO",
                    "source": "NCIC/TCIC",
                    "title": bolo.title,
                    "description": bolo.description,
                    "priority": bolo.priority,
                    "match_reason": "Address match on BOLO",
                })

    if last:
        for warrant in warrants:
            subject = _norm_name(warrant.subject_name)
            if last in subject or subject in full or (first and first in subject):
                _append_hit(hits, seen, {
                    "type": "WARRANT",
                    "source": "TCIC",
                    "subject_name": warrant.subject_name,
                    "warrant_type": warrant.warrant_type,
                    "case_number": warrant.case_number,
                    "location_hint": warrant.location_hint,
                    "match_reason": "Name match",
                })
        for bolo in bolos:
            if last.lower() in bolo.description.lower() or last.lower() in bolo.title.lower():
                _append_hit(hits, seen, {
                    "type": "BOLO",
                    "source": "NCIC/TCIC",
                    "title": bolo.title,
                    "description": bolo.description,
                    "priority": bolo.priority,
                    "match_reason": "Name match on BOLO",
                })

    status = "hit" if hits else "clear"
    return {
        "query_id": str(uuid.uuid4()),
        "query_type": "person",
        "status": status,
        "name": full or None,
        "dob": payload.dob,
        "dl_number": payload.dl_number,
        "sid": payload.sid.upper() if payload.sid else None,
        "address": payload.address,
        "hits": hits,
        "message": f"{'HIT — ' + str(len(hits)) + ' record(s)' if hits else 'NO RECORD'} — NCIC/TCIC person query",
        "queried_at": datetime.now(UTC).isoformat(),
    }


def _address_tokens_match(query: str, target: str) -> bool:
    """Match if significant address tokens overlap (e.g. '2200 ELM' ↔ '2200 BLOCK ELM ST')."""
    stop = {"ST", "STREET", "AVE", "AVENUE", "RD", "ROAD", "DR", "DRIVE", "BLVD", "BLOCK", "APT", "UNIT", "THE"}
    q_tokens = {t for t in re.split(r"[\s,]+", query) if len(t) > 2 and t not in stop}
    t_tokens = {t for t in re.split(r"[\s,]+", target) if len(t) > 2 and t not in stop}
    return bool(q_tokens & t_tokens)
