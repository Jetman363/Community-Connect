from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.engine import create_cad_incident, create_case_for_incident, dispatcher_status_action, officer_status_action, start_scenario, stop_scenario, submit_officer_report, sync_to_rms
from app.report_layout import fetch_rms_report_layout
from app.scenarios import SCENARIOS
from app.settings import settings
from app.store import broadcast, store

app = FastAPI(title="BlueCore Demo Orchestrator", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DemoToggle(BaseModel):
    enabled: bool


class CreateCallRequest(BaseModel):
    nature: str
    incident_type: str = "general"
    priority: str = "P3"
    location: str | None = None
    apartment: str | None = None
    caller_name: str | None = None
    caller_phone: str | None = None
    narrative: str | None = None
    weapons_involved: bool = False
    injuries: bool = False
    actor_id: str = "calltaker"


class MessageRequest(BaseModel):
    sender_id: str
    sender_role: str
    message: str
    priority: str = "normal"
    incident_id: str | None = None
    recipient_role: str | None = None


class SupervisorNote(BaseModel):
    incident_id: str
    note: str
    actor_id: str = "supervisor"


class OfficerStatusRequest(BaseModel):
    call_sign: str
    status: str
    incident_id: str | None = None
    require_report: bool = False
    actor_id: str = "officer"
    officer_name: str | None = None
    caller_role: str = "officer"


class DispatcherStatusRequest(BaseModel):
    call_sign: str
    status: str
    incident_id: str | None = None
    release_from_call: bool = False
    actor_id: str = "dispatcher"
    dispatcher_name: str | None = None


class CreateCaseRequest(BaseModel):
    incident_id: str
    actor_id: str = "officer"
    call_sign: str
    officer_name: str | None = None
    caller_role: str = "officer"


class SubmitReportRequest(BaseModel):
    narrative: str
    actor_id: str = "officer"
    caller_role: str = "officer"


REPORT_ROLES = {"officer"}


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok", "service": "demo-orchestrator", "demo_mode": store.demo_mode}


@app.get("/v1/demo/status")
async def demo_status() -> dict:
    return {
        "demo_mode": store.demo_mode,
        "active_scenario": store.active_scenario,
        "incoming_call": store.incoming_call,
        "timeline_count": len(store.timeline),
        "message_count": len(store.messages),
    }


@app.post("/v1/demo/toggle")
async def toggle_demo(payload: DemoToggle) -> dict:
    store.demo_mode = payload.enabled
    await broadcast("demo_mode_changed", {"enabled": payload.enabled})
    await store.audit("demo_mode_toggle", "admin", {"enabled": payload.enabled})
    return {"demo_mode": store.demo_mode}


@app.get("/v1/demo/scenarios")
async def list_scenarios() -> list[dict]:
    return [{"id": k, "name": v["name"], "description": v["description"], "priority": v.get("priority")} for k, v in SCENARIOS.items()]


@app.post("/v1/demo/scenarios/{scenario_id}/start")
async def run_scenario(scenario_id: str) -> dict:
    if not start_scenario(scenario_id):
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"started": scenario_id, "name": SCENARIOS[scenario_id]["name"]}


@app.post("/v1/demo/scenarios/stop")
async def halt_scenario() -> dict:
    stop_scenario()
    return {"stopped": True}


@app.get("/v1/demo/timeline")
async def get_timeline(incident_id: str | None = None, limit: int = 100) -> list[dict]:
    items = store.timeline
    if incident_id:
        items = [t for t in items if t.get("incident_id") == incident_id]
    return items[:limit]


@app.get("/v1/demo/messages")
async def get_messages(incident_id: str | None = None) -> list[dict]:
    items = store.messages
    if incident_id:
        items = [m for m in items if m.get("incident_id") == incident_id]
    return items


@app.post("/v1/demo/messages")
async def send_message(payload: MessageRequest) -> dict:
    msg = await store.add_message(
        payload.sender_id, payload.sender_role, payload.message,
        priority=payload.priority, incident_id=payload.incident_id, recipient_role=payload.recipient_role,
    )
    await store.audit("message_sent", payload.sender_id, {"message_id": msg["id"]})
    await broadcast("message_sent", {"message": msg})
    return msg


@app.post("/v1/demo/calls/create")
async def create_call(payload: CreateCallRequest) -> dict:
    store.incoming_call = None
    incident = await create_cad_incident(payload.model_dump(exclude={"actor_id"}), payload.actor_id)
    if not incident:
        raise HTTPException(status_code=502, detail="Failed to create CAD incident")
    return incident


@app.post("/v1/demo/calls/clear")
async def clear_incoming_call() -> dict:
    store.incoming_call = None
    await broadcast("call_cleared", {})
    return {"cleared": True}


@app.post("/v1/demo/supervisor/note")
async def supervisor_note(payload: SupervisorNote) -> dict:
    entry = await store.add_timeline(
        "supervisor_note_added", payload.note,
        incident_id=payload.incident_id, actor_id=payload.actor_id, actor_role="supervisor",
    )
    await broadcast("supervisor_note_added", {"incident_id": payload.incident_id, "note": payload.note, "timeline": entry})
    return entry


@app.post("/v1/demo/rms/sync/{incident_id}")
async def rms_sync(incident_id: str, incident_data: dict) -> dict:
    return await sync_to_rms(incident_id, incident_data)


@app.get("/v1/demo/rms/cases")
async def rms_cases(
    incident_id: str | None = None,
    incident_number: str | None = None,
    case_number: str | None = None,
) -> list[dict]:
    if incident_id or incident_number or case_number:
        return store.lookup_rms_cases(
            incident_id=incident_id,
            incident_number=incident_number,
            case_number=case_number,
        )
    return store.rms_cases


@app.get("/v1/demo/reports/pending")
async def pending_reports(
    call_sign: str | None = None,
    officer_id: str | None = None,
    caller_role: str = "officer",
) -> list[dict]:
    if caller_role not in REPORT_ROLES:
        raise HTTPException(status_code=403, detail="Reports are restricted to officers")
    return store.list_pending_reports(call_sign=call_sign, officer_id=officer_id)


@app.post("/v1/demo/officer/status")
async def officer_status(payload: OfficerStatusRequest) -> dict:
    if payload.caller_role not in REPORT_ROLES and payload.require_report:
        raise HTTPException(status_code=403, detail="Reports are restricted to officers")
    try:
        return await officer_status_action(
            call_sign=payload.call_sign,
            status=payload.status,
            incident_id=payload.incident_id,
            require_report=payload.require_report,
            actor_id=payload.actor_id,
            officer_name=payload.officer_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/v1/demo/reports/create-case")
async def create_case(payload: CreateCaseRequest) -> dict:
    if payload.caller_role not in REPORT_ROLES:
        raise HTTPException(status_code=403, detail="Reports are restricted to officers")
    try:
        return await create_case_for_incident(
            incident_id=payload.incident_id,
            actor_id=payload.actor_id,
            call_sign=payload.call_sign,
            officer_name=payload.officer_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/v1/demo/dispatcher/unit-status")
async def dispatcher_unit_status(payload: DispatcherStatusRequest) -> dict:
    try:
        return await dispatcher_status_action(
            call_sign=payload.call_sign,
            status=payload.status,
            incident_id=payload.incident_id,
            actor_id=payload.actor_id,
            dispatcher_name=payload.dispatcher_name,
            release_from_call=payload.release_from_call,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/v1/demo/reports/{report_id}/layout")
async def report_layout(report_id: str, caller_role: str = "officer") -> dict:
    if caller_role not in REPORT_ROLES:
        raise HTTPException(status_code=403, detail="Reports are restricted to officers")
    try:
        return await fetch_rms_report_layout(report_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/v1/demo/reports/{report_id}/submit")
async def submit_report(report_id: str, payload: SubmitReportRequest) -> dict:
    if payload.caller_role not in REPORT_ROLES:
        raise HTTPException(status_code=403, detail="Reports are restricted to officers")
    try:
        return await submit_officer_report(report_id, payload.narrative, payload.actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/v1/demo/audit")
async def audit_log(limit: int = 100) -> list[dict]:
    return store.audit_log[:limit]
