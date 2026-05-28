"""Operations Platform incident report layout — shared with MDT RMS pull."""

from __future__ import annotations

import copy
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.store import cad_request, store

_LAYOUT_PATH = Path(__file__).with_name("incident-report-layout.json")

_PRIORITY_MAP = {"P1": "Emergency", "P2": "Priority", "P3": "Routine", "P4": "Low"}


def _load_template() -> dict[str, Any]:
    with _LAYOUT_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def _empty_entry(section: dict) -> dict[str, str]:
    entry: dict[str, str] = {}
    for field in section.get("fields", []):
        default = field.get("default", "")
        field_type = field.get("type")
        if field_type == "checkbox":
            entry[field["id"]] = "false"
        elif field_type == "yes_no":
            entry[field["id"]] = ""
        else:
            entry[field["id"]] = str(default) if default else ""
    return entry


def _priority_label(raw: str | None) -> str:
    if not raw:
        return "Routine"
    upper = raw.upper()
    if upper in _PRIORITY_MAP:
        return _PRIORITY_MAP[upper]
    return raw


def _section_by_id(template: dict, section_id: str) -> dict:
    for section in template["sections"]:
        if section["id"] == section_id:
            return section
    return {"fields": []}


def _build_prefill(report: dict, incident: dict | None, template: dict) -> dict[str, list[dict[str, str]]]:
    now = datetime.now(UTC)
    officer = report.get("officer_name") or report.get("call_sign") or ""
    call_sign = report.get("call_sign") or ""
    location = report.get("location") or (incident or {}).get("location") or ""
    nature = report.get("nature") or (incident or {}).get("nature") or ""
    incident_type = (incident or {}).get("incident_type") or nature or "general"
    caller = (incident or {}).get("caller_name") or ""
    caller_phone = (incident or {}).get("caller_phone") or ""
    narrative_seed = report.get("narrative") or (incident or {}).get("narrative") or ""
    weapons = bool((incident or {}).get("weapons_involved"))
    injuries = bool((incident or {}).get("injuries"))
    is_traffic = any(k in f"{incident_type} {nature}".lower() for k in ("traffic", "dwi", "vehicle"))

    header = _empty_entry(_section_by_id(template, "header"))
    incident_number = report.get("incident_number") or (incident or {}).get("incident_number") or ""
    case_number = report.get("case_number") or (incident or {}).get("case_number") or ""
    header.update({
        "incident_number": incident_number,
        "case_number": case_number,
        "report_date": now.strftime("%Y-%m-%d"),
        "report_time": now.strftime("%H:%M"),
        "reporting_officer_name": officer,
        "incident_location": location,
        "incident_type": incident_type,
        "call_type": "911" if caller else "Officer Initiated",
        "priority_level": _priority_label((incident or {}).get("priority")),
        "agency": "San Antonio Police Department",
        "division_unit": call_sign,
    })

    victims: list[dict[str, str]] = []
    if caller:
        victim = _empty_entry(_section_by_id(template, "victims"))
        victim.update({
            "role": "complainant",
            "full_name": caller,
            "phone_number": caller_phone,
            "home_address": location,
        })
        if injuries:
            victim["injury_information"] = "Injuries reported"
        victims.append(victim)
    else:
        victim = _empty_entry(_section_by_id(template, "victims"))
        victim["role"] = "victim"
        if injuries:
            victim["injury_information"] = "Injuries reported at scene"
        victims.append(victim)

    suspects = [_empty_entry(_section_by_id(template, "suspects"))]

    vehicles: list[dict[str, str]] = []
    if is_traffic:
        vehicle = _empty_entry(_section_by_id(template, "vehicles"))
        vehicle["state"] = "TX"
        vehicles.append(vehicle)

    weapons_entries: list[dict[str, str]] = []
    if weapons:
        weapons_entries.append(_empty_entry(_section_by_id(template, "weapons")))

    narrative = _empty_entry(_section_by_id(template, "narrative"))
    narrative["narrative"] = narrative_seed

    return {
        "header": [header],
        "victims": victims,
        "suspects": suspects,
        "vehicles": vehicles,
        "weapons": weapons_entries,
        "property_items": [],
        "narcotics": [],
        "narrative": [narrative],
    }


async def fetch_rms_report_layout(report_id: str) -> dict[str, Any]:
    """Pull full Operations Platform report layout with CAD-prefilled values."""
    report = store.get_pending_report(report_id)
    if not report:
        raise ValueError("Report not found")

    incident: dict | None = None
    incident_id = report.get("incident_id")
    if incident_id:
        raw = await cad_request("GET", f"/incidents/{incident_id}")
        if isinstance(raw, dict):
            incident = raw

    incident_number = report.get("incident_number") or (incident or {}).get("incident_number") or ""
    case_number = report.get("case_number") or (incident or {}).get("case_number") or ""

    rms_link = store.resolve_rms_link(
        incident_id=incident_id,
        incident_number=incident_number or None,
        case_number=case_number or None,
    )
    if rms_link:
        incident_number = rms_link.get("incident_number") or incident_number
        case_number = rms_link.get("case_number") or case_number
    elif case_number and incident_number:
        rms_link = {
            "incident_id": incident_id,
            "incident_number": incident_number,
            "case_number": case_number,
            "linked": True,
        }

    template = _load_template()
    prefill = _build_prefill(report, incident, template)
    if case_number:
        prefill["header"][0]["case_number"] = case_number
    if incident_number:
        prefill["header"][0]["incident_number"] = incident_number
    sections: list[dict[str, Any]] = []

    for section_tpl in template["sections"]:
        section = copy.deepcopy(section_tpl)
        sid = section["id"]
        entries = copy.deepcopy(prefill.get(sid, []))
        min_entries = section.get("min_entries", 0)
        while len(entries) < min_entries:
            entries.append(_empty_entry(section))
        section["entries"] = entries
        sections.append(section)

    return {
        "report_id": report_id,
        "incident_id": incident_id,
        "incident_number": incident_number,
        "case_number": case_number or None,
        "rms_link": rms_link,
        "source_system": template["source_system"],
        "template_name": template["template_name"],
        "template_version": template["template_version"],
        "prefilled_from": ["Operations Platform", "CAD", "RMS", "pending_report"],
        "sections": sections,
    }
