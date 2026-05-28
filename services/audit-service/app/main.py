from datetime import datetime, timezone
from hashlib import sha256
import ast
import sqlite3
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Audit Service", version="0.1.0")
DB_PATH = "audit.db"


class AuditEventIn(BaseModel):
    event_type: str
    actor_id: str | None = None
    resource_type: str
    resource_id: str
    action: str
    outcome: str
    metadata: dict = {}


def _event_hash(record: dict) -> str:
    canonical = (
        f"{record['event_type']}|{record.get('actor_id')}|{record['resource_type']}|"
        f"{record['resource_id']}|{record['action']}|{record['outcome']}|"
        f"{record['created_at']}|{record.get('prev_hash')}|{record.get('metadata')}"
    )
    return sha256(canonical.encode("utf-8")).hexdigest()


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.on_event("startup")
async def startup() -> None:
    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                prev_hash TEXT,
                hash TEXT NOT NULL,
                event_type TEXT NOT NULL,
                actor_id TEXT,
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                action TEXT NOT NULL,
                outcome TEXT NOT NULL,
                metadata TEXT NOT NULL
            )
            """
        )
        conn.commit()


@app.post("/v1/events")
async def append_event(event: AuditEventIn) -> dict:
    with _conn() as conn:
        row = conn.execute("SELECT hash FROM audit_events ORDER BY id DESC LIMIT 1").fetchone()
        prev_hash = row["hash"] if row else None
    record = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prev_hash": prev_hash,
        **event.model_dump(),
    }
    record["hash"] = _event_hash(record)
    with _conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO audit_events (
                created_at, prev_hash, hash, event_type, actor_id, resource_type, resource_id, action, outcome, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["created_at"],
                record["prev_hash"],
                record["hash"],
                record["event_type"],
                record.get("actor_id"),
                record["resource_type"],
                record["resource_id"],
                record["action"],
                record["outcome"],
                repr(record.get("metadata", {})),
            ),
        )
        conn.commit()
        index = cur.lastrowid
    return {"stored": True, "index": index, "hash": record["hash"], "prev_hash": prev_hash}


@app.get("/v1/events")
async def list_events() -> list[dict]:
    with _conn() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, prev_hash, hash, event_type, actor_id, resource_type, resource_id, action, outcome, metadata
            FROM audit_events ORDER BY id ASC
            """
        ).fetchall()
    events = []
    for row in rows:
        item = dict(row)
        try:
            item["metadata"] = ast.literal_eval(item["metadata"])
        except Exception:
            pass
        events.append(item)
    return events


@app.get("/v1/verify")
async def verify_chain() -> dict:
    with _conn() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, prev_hash, hash, event_type, actor_id, resource_type, resource_id, action, outcome, metadata
            FROM audit_events ORDER BY id ASC
            """
        ).fetchall()
    previous_hash = None
    for row in rows:
        record = dict(row)
        if record["prev_hash"] != previous_hash:
            return {"valid": False, "error": f"Broken prev_hash at id {record['id']}"}
        metadata = record.get("metadata")
        try:
            metadata = ast.literal_eval(metadata) if isinstance(metadata, str) else metadata
        except Exception:
            metadata = metadata
        expected = _event_hash(
            {
                "event_type": record["event_type"],
                "actor_id": record.get("actor_id"),
                "resource_type": record["resource_type"],
                "resource_id": record["resource_id"],
                "action": record["action"],
                "outcome": record["outcome"],
                "created_at": record["created_at"],
                "prev_hash": record["prev_hash"],
                "metadata": metadata,
            }
        )
        if record["hash"] != expected:
            return {"valid": False, "error": f"Hash mismatch at id {record['id']}"}
        previous_hash = record["hash"]
    return {"valid": True, "events_checked": len(rows), "last_hash": previous_hash}
