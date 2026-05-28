import asyncio
import json
import os
from datetime import datetime, timezone
import sqlite3
import hmac
import hashlib

from redis.asyncio import Redis
from prometheus_client import Counter, start_http_server

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
TOPIC_PREFIX = os.getenv("EVENT_BUS_TOPIC_PREFIX", "bluecore")
CONSUMER_GROUP = os.getenv("EVENT_CONSUMER_GROUP", "ops-analytics")
CONSUMER_NAME = os.getenv("EVENT_CONSUMER_NAME", "consumer-1")
METRICS_PORT = int(os.getenv("EVENT_CONSUMER_METRICS_PORT", "9111"))
DB_PATH = "consumer.db"
CONSUMED_TOTAL = Counter("event_consumer_processed_total", "Total processed events")
REPLAY_SKIPPED_TOTAL = Counter("event_consumer_replay_skipped_total", "Total replayed events skipped")
CONSUMER_FAILURE_TOTAL = Counter("event_consumer_failures_total", "Total consumer failures")
SIGNATURE_INVALID_TOTAL = Counter("event_consumer_invalid_signature_total", "Total invalid signed events")

STREAMS = [
    f"{TOPIC_PREFIX}.auth.user.created.v1",
    f"{TOPIC_PREFIX}.auth.user.login.v1",
    f"{TOPIC_PREFIX}.rms.report.created.v1",
    f"{TOPIC_PREFIX}.ai.report.generated.v1",
    f"{TOPIC_PREFIX}.dlq.outbox.v1",
]


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS processed_messages (
                stream TEXT NOT NULL,
                message_id TEXT NOT NULL,
                processed_at TEXT NOT NULL,
                PRIMARY KEY(stream, message_id)
            )
            """
        )
        conn.commit()


def _was_processed(stream: str, message_id: str) -> bool:
    with _conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM processed_messages WHERE stream = ? AND message_id = ?",
            (stream, message_id),
        ).fetchone()
    return row is not None


def _mark_processed(stream: str, message_id: str) -> None:
    with _conn() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO processed_messages (stream, message_id, processed_at) VALUES (?, ?, ?)",
            (stream, message_id, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()


async def ensure_groups(redis: Redis) -> None:
    for stream in STREAMS:
        try:
            await redis.xgroup_create(stream, CONSUMER_GROUP, id="0", mkstream=True)
        except Exception:
            # Group likely exists already.
            pass


async def process_message(stream: str, message_id: str, fields: dict) -> None:
    message_raw = fields.get("message", "{}")
    try:
        parsed = json.loads(message_raw)
    except Exception:
        parsed = {"envelope": {"payload": {"raw_payload": message_raw}}, "signature": ""}
    envelope = parsed.get("envelope", {})
    signature = parsed.get("signature", "")
    signing_secret = os.getenv("EVENT_SIGNING_SECRET", "dev-signing-secret")
    canonical = json.dumps(envelope, sort_keys=True, separators=(",", ":"))
    expected = hmac.new(signing_secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
    if not signature or not hmac.compare_digest(signature, expected):
        SIGNATURE_INVALID_TOTAL.inc()
        raise ValueError("Invalid event signature")
    payload = envelope.get("payload", {})
    print(
        json.dumps(
            {
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "stream": stream,
                "message_id": message_id,
                "payload": payload,
            }
        )
    )


async def consumer_loop() -> None:
    _init_db()
    start_http_server(METRICS_PORT)
    redis = Redis.from_url(REDIS_URL, decode_responses=True)
    await ensure_groups(redis)
    while True:
        entries = await redis.xreadgroup(
            groupname=CONSUMER_GROUP,
            consumername=CONSUMER_NAME,
            streams={stream: ">" for stream in STREAMS},
            count=20,
            block=5000,
        )
        if not entries:
            continue
        for stream, messages in entries:
            for message_id, fields in messages:
                try:
                    if _was_processed(stream, message_id):
                        REPLAY_SKIPPED_TOTAL.inc()
                        await redis.xack(stream, CONSUMER_GROUP, message_id)
                        continue
                    await process_message(stream, message_id, fields)
                    _mark_processed(stream, message_id)
                    CONSUMED_TOTAL.inc()
                    await redis.xack(stream, CONSUMER_GROUP, message_id)
                except Exception as exc:  # noqa: BLE001
                    CONSUMER_FAILURE_TOTAL.inc()
                    await redis.xadd(
                        f"{TOPIC_PREFIX}.dlq.consumer.v1",
                        {
                            "payload": json.dumps(
                                {
                                    "stream": stream,
                                    "message_id": message_id,
                                    "error": str(exc),
                                    "failed_at": datetime.now(timezone.utc).isoformat(),
                                }
                            )
                        },
                    )


if __name__ == "__main__":
    asyncio.run(consumer_loop())
