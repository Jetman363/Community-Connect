import json
import os
import hmac
import hashlib
from datetime import datetime, timezone
from typing import Any


class EventPublisher:
    """
    Pluggable event publisher contract.
    Current default implementation is local stdout publishing, which can be
    swapped for Redis Streams, NATS, or Kafka adapters.
    """

    async def publish(self, topic: str, payload: dict[str, Any]) -> None:
        backend = os.getenv("EVENT_BUS_BACKEND", "stdout").lower()
        topic_prefix = os.getenv("EVENT_BUS_TOPIC_PREFIX", "bluecore")
        full_topic = f"{topic_prefix}.{topic}" if topic_prefix else topic
        signing_secret = os.getenv("EVENT_SIGNING_SECRET", "dev-signing-secret")
        envelope = {
            "topic": full_topic,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }
        canonical = json.dumps(envelope, sort_keys=True, separators=(",", ":"))
        signature = hmac.new(signing_secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()
        message = {"envelope": envelope, "signature": signature}
        if backend == "redis":
            try:
                from redis.asyncio import Redis  # type: ignore
            except Exception:
                print(json.dumps({"message": message, "backend": "stdout-fallback"}))
                return
            redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
            client = Redis.from_url(redis_url, decode_responses=True)
            await client.xadd(full_topic, {"message": json.dumps(message)})
            await client.aclose()
            return
        print(json.dumps({"message": message, "backend": "stdout"}))


publisher = EventPublisher()
