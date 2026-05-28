import asyncio
import logging
from typing import Any

from app.scenarios import SCENARIOS
from app.settings import settings
from app.store import broadcast, cad_request, resolve_unit_id, store

logger = logging.getLogger(__name__)

_running_scenario: asyncio.Task | None = None


async def create_cad_incident(fields: dict[str, Any], actor: str = "calltaker") -> dict | None:
    payload = {"agency_id": settings.agency_id, **fields}
    incident = await cad_request("POST", "/incidents", json_body=payload, params={"actor_id": actor})
    if not incident:
        return None
    entry = await store.add_timeline(
        "cad_event_created",
        f"CAD event {incident.get('incident_number')} created — {fields.get('nature', '')}",
        incident_id=incident.get("id"),
        actor_id=actor,
        actor_role=actor,
    )
    await store.audit("cad_event_created", actor, {"incident_id": incident.get("id")})
    await broadcast("cad_event_created", {"incident": incident, "timeline": entry})
    await broadcast("new_call_created", {"incident": incident})
    return incident


async def assign_unit(incident_id: str, call_sign: str, actor: str = "dispatcher") -> None:
    unit_id = await resolve_unit_id(call_sign)
    if not unit_id:
        return
    await cad_request("POST", f"/incidents/{incident_id}/assign", json_body={"unit_id": unit_id, "is_primary": True}, params={"actor_id": actor})
    entry = await store.add_timeline(
        "unit_assigned",
        f"Unit {call_sign} assigned to incident",
        incident_id=incident_id,
        actor_id=actor,
        actor_role=actor,
        metadata={"unit": call_sign},
    )
    await broadcast("unit_assigned", {"incident_id": incident_id, "unit": call_sign, "timeline": entry})


async def update_unit_status(call_sign: str, status: str, actor: str = "officer", incident_id: str | None = None) -> None:
    unit_id = await resolve_unit_id(call_sign)
    if not unit_id:
        return
    body: dict[str, Any] = {"status": status}
    if incident_id:
        body["incident_id"] = incident_id
    await cad_request("PATCH", f"/units/{unit_id}/status", json_body=body, params={"actor_id": actor})
    event_map = {
        "en_route": "officer_enroute",
        "on_scene": "officer_onscene",
        "clear": "unit_cleared",
        "available": "unit_cleared",
        "emergency": "officer_request_backup",
        "transporting": "call_updated",
        "out_of_service": "call_updated",
    }
    event_type = event_map.get(status, "call_updated")
    entry = await store.add_timeline(
        event_type,
        f"Unit {call_sign} status → {status.replace('_', ' ')}",
        incident_id=incident_id,
        actor_id=actor,
        actor_role=actor,
        metadata={"unit": call_sign, "status": status},
    )
    await broadcast(event_type, {"unit": call_sign, "status": status, "incident_id": incident_id, "timeline": entry})


async def create_case_for_incident(
    *,
    incident_id: str,
    actor_id: str,
    call_sign: str,
    officer_name: str | None = None,
) -> dict[str, Any]:
    incident = await cad_request("POST", f"/incidents/{incident_id}/create-case", params={"actor_id": actor_id})
    if not incident or not isinstance(incident, dict):
        raise ValueError("Failed to create case number")

    case_number = incident.get("case_number")
    if not case_number:
        meta = incident.get("metadata_json") or {}
        case_number = meta.get("case_number")

    pending_report = await store.create_pending_report(
        incident_id=incident_id,
        incident_number=incident.get("incident_number", ""),
        case_number=case_number,
        nature=incident.get("nature", ""),
        location=incident.get("location"),
        officer_id=actor_id,
        call_sign=call_sign,
        officer_name=officer_name,
    )
    store.register_rms_case(
        incident_id=incident_id,
        incident_number=incident.get("incident_number", ""),
        case_number=case_number,
        nature=incident.get("nature", ""),
        officer=officer_name or call_sign,
        status="open",
    )
    entry = await store.add_timeline(
        "case_created",
        f"Case {case_number} opened — mandatory report for incident {incident.get('incident_number')}",
        incident_id=incident_id,
        actor_id=actor_id,
        actor_role="officer",
        metadata={"case_number": case_number, "unit": call_sign, "report_id": pending_report["id"]},
    )
    await broadcast("case_created", {
        "incident_id": incident_id,
        "incident": incident,
        "case_number": case_number,
        "pending_report": pending_report,
        "timeline": entry,
    })
    return {"incident": incident, "case_number": case_number, "pending_report": pending_report, "timeline": entry}


async def dispatcher_status_action(
    *,
    call_sign: str,
    status: str,
    incident_id: str | None,
    actor_id: str,
    dispatcher_name: str | None = None,
    release_from_call: bool = False,
) -> dict[str, Any]:
    unit_id = await resolve_unit_id(call_sign)
    if not unit_id:
        raise ValueError(f"Unit {call_sign} not found")

    body: dict[str, Any] = {"status": status, "require_report": False, "release_from_call": release_from_call}
    if incident_id:
        body["incident_id"] = incident_id

    unit = await cad_request(
        "PATCH",
        f"/units/{unit_id}/status",
        json_body=body,
        params={"actor_id": actor_id},
    )
    if not unit:
        raise ValueError("CAD status update failed")

    label = status.replace("_", " ")
    action = "released from call" if release_from_call else f"→ {label}"
    entry = await store.add_timeline(
        "dispatcher_status_change",
        f"Dispatcher set unit {call_sign} {action}",
        incident_id=incident_id,
        actor_id=actor_id,
        actor_role="dispatcher",
        metadata={"unit": call_sign, "status": status, "dispatcher": dispatcher_name},
    )
    await broadcast("dispatcher_status_change", {
        "unit": call_sign,
        "status": status,
        "incident_id": incident_id,
        "timeline": entry,
    })
    return {"unit": unit, "timeline": entry}


async def officer_status_action(
    *,
    call_sign: str,
    status: str,
    incident_id: str | None,
    require_report: bool,
    actor_id: str,
    officer_name: str | None = None,
) -> dict[str, Any]:
    unit_id = await resolve_unit_id(call_sign)
    if not unit_id:
        raise ValueError(f"Unit {call_sign} not found")

    body: dict[str, Any] = {"status": status, "require_report": require_report}
    if incident_id:
        body["incident_id"] = incident_id

    unit = await cad_request(
        "PATCH",
        f"/units/{unit_id}/status",
        json_body=body,
        params={"actor_id": actor_id},
    )
    if not unit:
        raise ValueError("CAD status update failed")

    incident: dict | None = None
    pending_report: dict | None = None

    if require_report and incident_id:
        incident = await cad_request("GET", f"/incidents/{incident_id}")
        if incident:
            pending_report = await store.create_pending_report(
                incident_id=incident_id,
                incident_number=incident.get("incident_number", ""),
                case_number=incident.get("case_number"),
                nature=incident.get("nature", ""),
                location=incident.get("location"),
                officer_id=actor_id,
                call_sign=call_sign,
                officer_name=officer_name,
            )
            entry = await store.add_timeline(
                "report_required",
                f"Unit {call_sign} 10-8 — incident report required for {incident.get('incident_number')}",
                incident_id=incident_id,
                actor_id=call_sign,
                actor_role="officer",
                metadata={"unit": call_sign, "report_id": pending_report["id"]},
            )
            await broadcast("report_required", {
                "incident_id": incident_id,
                "unit": call_sign,
                "pending_report": pending_report,
                "timeline": entry,
            })
            return {"unit": unit, "incident": incident, "pending_report": pending_report, "timeline": entry}

    event_map = {
        "en_route": "officer_enroute",
        "on_scene": "officer_onscene",
        "clear": "unit_cleared",
        "transporting": "call_updated",
        "out_of_service": "call_updated",
    }
    event_type = event_map.get(status, "call_updated")
    label = status.replace("_", " ")
    entry = await store.add_timeline(
        event_type,
        f"Unit {call_sign} → {label}",
        incident_id=incident_id,
        actor_id=call_sign,
        actor_role="officer",
        metadata={"unit": call_sign, "status": status},
    )
    await broadcast(event_type, {"unit": call_sign, "status": status, "incident_id": incident_id, "timeline": entry})
    return {"unit": unit, "timeline": entry}


async def submit_officer_report(report_id: str, narrative: str, actor_id: str) -> dict:
    report = await store.submit_pending_report(report_id, narrative, actor_id)
    if not report:
        raise ValueError("Report not found")
    incident_id = report.get("incident_id")
    entry = await store.add_timeline(
        "report_completed",
        f"Report submitted for {report.get('incident_number')}",
        incident_id=incident_id,
        actor_id=actor_id,
        actor_role="officer",
        metadata={"report_id": report_id},
    )
    if incident_id:
        await cad_request(
            "PATCH",
            f"/incidents/{incident_id}",
            json_body={"status": "closed"},
            params={"actor_id": actor_id},
        )
    await broadcast("report_completed", {"incident_id": incident_id, "report": report, "timeline": entry})
    return report


async def sync_to_rms(incident_id: str, incident_data: dict) -> dict:
    case = {
        "incident_id": incident_id,
        "incident_number": incident_data.get("incident_number"),
        "nature": incident_data.get("nature"),
        "timeline": [t for t in store.timeline if t.get("incident_id") == incident_id],
        "messages": [m for m in store.messages if m.get("incident_id") == incident_id],
        "status": "pending_report",
    }
    store.rms_cases.insert(0, case)
    entry = await store.add_timeline(
        "report_completed",
        f"RMS case created for {incident_data.get('incident_number')}",
        incident_id=incident_id,
        actor_role="system",
    )
    await broadcast("report_completed", {"incident_id": incident_id, "rms_case": case, "timeline": entry})
    return case


async def run_scenario_step(step: dict, incident_id: str | None) -> str | None:
    event = step.get("event", "")
    actor = step.get("actor", "system")
    unit = step.get("unit", "")

    if event == "cad_event_created" and not incident_id:
        return None

    if event == "unit_assigned" and incident_id and unit:
        await assign_unit(incident_id, unit, actor)
    elif event == "officer_enroute" and unit:
        await update_unit_status(unit, "en_route", actor)
    elif event == "officer_onscene" and unit:
        await update_unit_status(unit, "on_scene", actor)
    elif event == "unit_cleared" and unit:
        await update_unit_status(unit, "clear", actor)
    elif event == "officer_request_backup" and unit:
        await update_unit_status(unit, "emergency", actor)
        msg = await store.add_message(unit, "officer", "REQUEST BACKUP — officer emergency", priority="emergency", incident_id=incident_id)
        await broadcast("officer_request_backup", {"unit": unit, "message": msg, "incident_id": incident_id})
    elif event == "incident_escalated":
        note = step.get("note", "Incident escalated to P1")
        entry = await store.add_timeline("incident_escalated", note, incident_id=incident_id, actor_id=actor, actor_role=actor)
        await broadcast("incident_escalated", {"incident_id": incident_id, "note": note, "timeline": entry})
    elif event == "supervisor_note_added":
        note = step.get("note", "Supervisor monitoring")
        entry = await store.add_timeline("supervisor_note_added", note, incident_id=incident_id, actor_id=actor, actor_role="supervisor")
        await broadcast("supervisor_note_added", {"incident_id": incident_id, "note": note, "timeline": entry})
    elif event == "report_started" and incident_id:
        entry = await store.add_timeline("report_started", f"Officer {unit} started report", incident_id=incident_id, actor_id=unit, actor_role="officer")
        await broadcast("report_started", {"incident_id": incident_id, "unit": unit, "timeline": entry})

    return incident_id


async def execute_scenario(scenario_id: str) -> None:
    scenario = SCENARIOS.get(scenario_id)
    if not scenario:
        return

    store.active_scenario = {"id": scenario_id, "name": scenario["name"], "status": "running", "step": 0}
    await broadcast("scenario_started", {"scenario_id": scenario_id, "name": scenario["name"]})

    incident: dict | None = None
    if scenario.get("call_fields"):
        store.incoming_call = {
            "scenario_id": scenario_id,
            "dialogue": scenario.get("caller_dialogue", []),
            "fields": scenario["call_fields"],
            "priority": scenario.get("priority", "P3"),
        }
        await broadcast("incoming_call", {"call": store.incoming_call})

        fields = {**scenario["call_fields"], "priority": scenario.get("priority", "P3"), "incident_type": scenario.get("incident_type", "general")}
        incident = await create_cad_incident(fields, "calltaker")

    incident_id = incident.get("id") if incident else None

    for i, step in enumerate(scenario.get("auto_steps", [])):
        if store.active_scenario:
            store.active_scenario["step"] = i + 1
        await asyncio.sleep(step.get("delay", 2))
        await run_scenario_step(step, incident_id)
        await broadcast("scenario_step", {"scenario_id": scenario_id, "step": i + 1, "event": step.get("event")})

    if incident_id and incident:
        await sync_to_rms(incident_id, incident)

    if store.active_scenario:
        store.active_scenario["status"] = "completed"
    await broadcast("scenario_completed", {"scenario_id": scenario_id})


def start_scenario(scenario_id: str) -> bool:
    global _running_scenario
    if scenario_id not in SCENARIOS:
        return False
    if _running_scenario and not _running_scenario.done():
        _running_scenario.cancel()
    _running_scenario = asyncio.create_task(execute_scenario(scenario_id))
    return True


def stop_scenario() -> None:
    global _running_scenario
    if _running_scenario and not _running_scenario.done():
        _running_scenario.cancel()
    store.active_scenario = None
