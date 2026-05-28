import asyncio
import json
import logging
import uuid
from datetime import UTC, datetime
from typing import Any

import httpx
from redis.asyncio import Redis

from app.settings import settings

logger = logging.getLogger(__name__)


class DemoStore:
    """Central in-memory demo state — timeline, messages, audit, active scenario."""

    def __init__(self) -> None:
        self.demo_mode: bool = settings.demo_mode_enabled
        self.timeline: list[dict[str, Any]] = []
        self.messages: list[dict[str, Any]] = []
        self.audit_log: list[dict[str, Any]] = []
        self.active_scenario: dict[str, Any] | None = None
        self.incoming_call: dict[str, Any] | None = None
        self.rms_cases: list[dict[str, Any]] = []
        self.pending_reports: list[dict[str, Any]] = []
        self._lock = asyncio.Lock()

    async def add_timeline(
        self,
        event_type: str,
        description: str,
        *,
        incident_id: str | None = None,
        actor_id: str = "system",
        actor_role: str = "system",
        metadata: dict | None = None,
    ) -> dict:
        entry = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "description": description,
            "incident_id": incident_id,
            "actor_id": actor_id,
            "actor_role": actor_role,
            "metadata": metadata or {},
            "timestamp": datetime.now(UTC).isoformat(),
        }
        async with self._lock:
            self.timeline.insert(0, entry)
            self.timeline = self.timeline[:500]
        return entry

    async def add_message(
        self,
        sender_id: str,
        sender_role: str,
        message: str,
        *,
        priority: str = "normal",
        incident_id: str | None = None,
        recipient_role: str | None = None,
    ) -> dict:
        msg = {
            "id": str(uuid.uuid4()),
            "sender_id": sender_id,
            "sender_role": sender_role,
            "message": message,
            "priority": priority,
            "incident_id": incident_id,
            "recipient_role": recipient_role,
            "read": False,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        async with self._lock:
            self.messages.insert(0, msg)
            self.messages = self.messages[:200]
        return msg

    async def create_pending_report(
        self,
        *,
        incident_id: str,
        incident_number: str,
        nature: str,
        location: str | None,
        officer_id: str,
        call_sign: str,
        officer_name: str | None = None,
        case_number: str | None = None,
    ) -> dict:
        report = {
            "id": str(uuid.uuid4()),
            "incident_id": incident_id,
            "incident_number": incident_number,
            "case_number": case_number,
            "nature": nature,
            "location": location,
            "officer_id": officer_id,
            "call_sign": call_sign,
            "officer_name": officer_name,
            "status": "draft",
            "narrative": "",
            "created_at": datetime.now(UTC).isoformat(),
        }
        async with self._lock:
            self.pending_reports = [r for r in self.pending_reports if r.get("incident_id") != incident_id]
            self.pending_reports.insert(0, report)
            self.pending_reports = self.pending_reports[:50]
        return report

    async def submit_pending_report(self, report_id: str, narrative: str, actor_id: str) -> dict | None:
        async with self._lock:
            for report in self.pending_reports:
                if report["id"] == report_id:
                    report["narrative"] = narrative
                    report["status"] = "submitted"
                    report["submitted_at"] = datetime.now(UTC).isoformat()
                    report["submitted_by"] = actor_id
                    self.pending_reports = [r for r in self.pending_reports if r["id"] != report_id]
                    submitted = {
                        "incident_id": report["incident_id"],
                        "incident_number": report["incident_number"],
                        "case_number": report.get("case_number"),
                        "linked": bool(report.get("case_number") and report.get("incident_number")),
                        "nature": report["nature"],
                        "narrative": narrative,
                        "officer": report.get("officer_name") or report.get("call_sign"),
                        "status": "submitted",
                        "submitted_at": datetime.now(UTC).isoformat(),
                    }
                    self.rms_cases = [c for c in self.rms_cases if c.get("incident_id") != report["incident_id"]]
                    self.rms_cases.insert(0, submitted)
                    return report
        return None

    def list_pending_reports(self, call_sign: str | None = None, officer_id: str | None = None) -> list[dict]:
        items = [r for r in self.pending_reports if r.get("status") == "draft"]
        if call_sign:
            items = [r for r in items if r.get("call_sign") == call_sign]
        if officer_id:
            items = [r for r in items if r.get("officer_id") == officer_id]
        return items

    def get_pending_report(self, report_id: str) -> dict | None:
        for report in self.pending_reports:
            if report.get("id") == report_id and report.get("status") == "draft":
                return report
        return None

    def register_rms_case(
        self,
        *,
        incident_id: str,
        incident_number: str,
        case_number: str | None,
        nature: str,
        officer: str | None = None,
        status: str = "open",
    ) -> dict:
        """Register or refresh RMS record linking case # to incident #."""
        self.rms_cases = [c for c in self.rms_cases if c.get("incident_id") != incident_id]
        record = {
            "id": str(uuid.uuid4()),
            "incident_id": incident_id,
            "incident_number": incident_number,
            "case_number": case_number,
            "linked": bool(case_number and incident_number),
            "nature": nature,
            "officer": officer,
            "status": status,
            "created_at": datetime.now(UTC).isoformat(),
        }
        self.rms_cases.insert(0, record)
        return record

    def lookup_rms_cases(
        self,
        *,
        incident_id: str | None = None,
        incident_number: str | None = None,
        case_number: str | None = None,
    ) -> list[dict[str, Any]]:
        items = self.rms_cases
        if incident_id:
            items = [c for c in items if c.get("incident_id") == incident_id]
        if incident_number:
            items = [c for c in items if c.get("incident_number") == incident_number]
        if case_number:
            items = [c for c in items if c.get("case_number") == case_number]
        return items

    def resolve_rms_link(
        self,
        *,
        incident_id: str | None = None,
        incident_number: str | None = None,
        case_number: str | None = None,
    ) -> dict[str, Any] | None:
        matches = self.lookup_rms_cases(
            incident_id=incident_id,
            incident_number=incident_number,
            case_number=case_number,
        )
        return matches[0] if matches else None

    async def audit(self, action: str, actor_id: str, details: dict | None = None) -> None:
        async with self._lock:
            self.audit_log.insert(0, {
                "id": str(uuid.uuid4()),
                "action": action,
                "actor_id": actor_id,
                "details": details or {},
                "timestamp": datetime.now(UTC).isoformat(),
            })


store = DemoStore()


async def broadcast(event_type: str, payload: dict[str, Any]) -> None:
    envelope = {
        "type": event_type,
        "agency_id": settings.agency_id,
        "timestamp": datetime.now(UTC).isoformat(),
        "source": "demo-orchestrator",
        "demo_mode": store.demo_mode,
        **payload,
    }
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True)
        await client.publish(f"{settings.event_stream_prefix}.live", json.dumps(envelope))
        await client.publish("bluecore.cad.live", json.dumps(envelope))
        await client.aclose()
    except Exception:  # noqa: BLE001
        logger.exception("Redis publish failed")

    try:
        async with httpx.AsyncClient(timeout=5) as http:
            await http.post(f"{settings.websocket_gateway_url}/internal/broadcast", json=envelope)
    except Exception:  # noqa: BLE001
        logger.warning("WS broadcast failed", exc_info=True)


async def cad_request(method: str, path: str, json_body: dict | None = None, params: dict | None = None) -> dict | list | None:
    url = f"{settings.cad_dispatch_url}{path}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if method == "GET":
                r = await client.get(url, params=params)
            elif method == "POST":
                r = await client.post(url, json=json_body, params=params)
            elif method == "PATCH":
                r = await client.patch(url, json=json_body, params=params)
            else:
                return None
            if r.status_code >= 400:
                logger.warning("CAD request failed %s %s: %s", method, path, r.text)
                return None
            return r.json()
    except Exception:  # noqa: BLE001
        logger.exception("CAD request error")
        return None


_unit_cache: dict[str, str] = {}


async def resolve_unit_id(call_sign: str) -> str | None:
    if call_sign in _unit_cache:
        return _unit_cache[call_sign]
    units = await cad_request("GET", "/units", params={"agency_id": settings.agency_id})
    if isinstance(units, list):
        for u in units:
            _unit_cache[u["call_sign"]] = u["id"]
    return _unit_cache.get(call_sign)
