import asyncio
from datetime import datetime, timezone
import json
import os
import sqlite3
import hmac
import hashlib

import httpx
from redis.asyncio import Redis
from prometheus_client import Counter, Gauge, start_http_server

DB_PATH = "relay.db"
POLL_INTERVAL_SECONDS = int(os.getenv("OUTBOX_RELAY_POLL_SECONDS", "5"))
MAX_RETRIES = int(os.getenv("OUTBOX_RELAY_MAX_RETRIES", "5"))
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
EVENT_TOPIC_PREFIX = os.getenv("EVENT_BUS_TOPIC_PREFIX", "bluecore")
METRICS_PORT = int(os.getenv("OUTBOX_RELAY_METRICS_PORT", "9110"))
CIRCUIT_OPEN_SECONDS = int(os.getenv("OUTBOX_RELAY_CIRCUIT_OPEN_SECONDS", "30"))

AUTH_BASE = os.getenv("AUTH_SERVICE_URL", "http://auth:8001")
RMS_BASE = os.getenv("RMS_SERVICE_URL", "http://rms-service:8010")
RELAY_DISPATCH_SUCCESS = Counter("outbox_relay_dispatch_success_total", "Successful outbox dispatches")
RELAY_DISPATCH_FAILURE = Counter("outbox_relay_dispatch_failure_total", "Failed outbox dispatch attempts")
RELAY_DLQ_TOTAL = Counter("outbox_relay_dlq_total", "Total events dead-lettered by relay")
RELAY_BACKOFF_SECONDS = Gauge("outbox_relay_backoff_seconds", "Current relay backoff seconds")

_circuit_state: dict[str, dict] = {
    "auth": {"consecutive_failures": 0, "open_until_ts": 0.0},
    "rms": {"consecutive_failures": 0, "open_until_ts": 0.0},
}


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS relay_failures (
                source TEXT NOT NULL,
                event_id INTEGER NOT NULL,
                retries INTEGER NOT NULL DEFAULT 0,
                last_error TEXT,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (source, event_id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dead_letter_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source TEXT NOT NULL,
                event_id INTEGER NOT NULL,
                topic TEXT,
                payload TEXT,
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _get_failure(source: str, event_id: int) -> sqlite3.Row | None:
    with _conn() as conn:
        return conn.execute(
            "SELECT source, event_id, retries FROM relay_failures WHERE source = ? AND event_id = ?",
            (source, event_id),
        ).fetchone()


def _upsert_failure(source: str, event_id: int, error: str) -> int:
    now = datetime.now(timezone.utc).isoformat()
    existing = _get_failure(source, event_id)
    retries = (existing["retries"] + 1) if existing else 1
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO relay_failures (source, event_id, retries, last_error, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(source, event_id)
            DO UPDATE SET retries = excluded.retries, last_error = excluded.last_error, updated_at = excluded.updated_at
            """,
            (source, event_id, retries, error, now),
        )
        conn.commit()
    return retries


def _clear_failure(source: str, event_id: int) -> None:
    with _conn() as conn:
        conn.execute("DELETE FROM relay_failures WHERE source = ? AND event_id = ?", (source, event_id))
        conn.commit()


def _append_dead_letter(source: str, event_id: int, topic: str | None, payload: str | None, reason: str) -> None:
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO dead_letter_events (source, event_id, topic, payload, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (source, event_id, topic, payload, reason, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()


async def _send_dlq_stream(redis: Redis, source: str, event_id: int, reason: str) -> None:
    stream = f"{EVENT_TOPIC_PREFIX}.dlq.outbox.v1"
    envelope = {
        "topic": stream,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {
            "source": source,
            "event_id": event_id,
            "reason": reason,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    }
    canonical = json.dumps(envelope, sort_keys=True, separators=(",", ":"))
    secret = os.getenv("EVENT_SIGNING_SECRET", "dev-signing-secret")
    signature = hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
    await redis.xadd(
        stream,
        {
            "message": json.dumps(
                {
                    "envelope": envelope,
                    "signature": signature,
                }
            )
        },
    )


async def _dispatch_source(client: httpx.AsyncClient, redis: Redis, source: str, base_url: str) -> None:
    now_ts = datetime.now(timezone.utc).timestamp()
    source_state = _circuit_state[source]
    if source_state["open_until_ts"] > now_ts:
        return
    pending_resp = await client.get(f"{base_url}/v1/outbox/pending", timeout=10)
    pending_resp.raise_for_status()
    events = pending_resp.json()
    for event in events:
        event_id = int(event["id"])
        topic = event.get("topic")
        payload = event.get("payload")
        try:
            dispatch_resp = await client.post(f"{base_url}/v1/outbox/dispatch/{event_id}", timeout=10)
            dispatch_resp.raise_for_status()
            _clear_failure(source, event_id)
            source_state["consecutive_failures"] = 0
            RELAY_DISPATCH_SUCCESS.inc()
        except Exception as exc:  # noqa: BLE001
            RELAY_DISPATCH_FAILURE.inc()
            source_state["consecutive_failures"] += 1
            retries = _upsert_failure(source, event_id, str(exc))
            if retries >= MAX_RETRIES:
                _append_dead_letter(source, event_id, topic, json.dumps(payload), str(exc))
                await _send_dlq_stream(redis, source, event_id, str(exc))
                _clear_failure(source, event_id)
                RELAY_DLQ_TOTAL.inc()
            if source_state["consecutive_failures"] >= 3:
                source_state["open_until_ts"] = datetime.now(timezone.utc).timestamp() + CIRCUIT_OPEN_SECONDS
                source_state["consecutive_failures"] = 0


async def relay_loop() -> None:
    _init_db()
    start_http_server(METRICS_PORT)
    redis = Redis.from_url(REDIS_URL, decode_responses=True)
    async with httpx.AsyncClient() as client:
        while True:
            backoff_seconds = POLL_INTERVAL_SECONDS
            try:
                await _dispatch_source(client, redis, "auth", AUTH_BASE)
            except Exception:
                pass
            try:
                await _dispatch_source(client, redis, "rms", RMS_BASE)
            except Exception:
                pass
            if _circuit_state["auth"]["open_until_ts"] > datetime.now(timezone.utc).timestamp() or _circuit_state["rms"][
                "open_until_ts"
            ] > datetime.now(timezone.utc).timestamp():
                backoff_seconds = max(POLL_INTERVAL_SECONDS, CIRCUIT_OPEN_SECONDS)
            RELAY_BACKOFF_SECONDS.set(backoff_seconds)
            await asyncio.sleep(backoff_seconds)


if __name__ == "__main__":
    asyncio.run(relay_loop())
