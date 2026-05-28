import json
from abc import ABC, abstractmethod
from typing import Any

from redis.asyncio import Redis

from app.settings import settings

_backend_instance: "EventBackend | None" = None


class EventBackend(ABC):
    @abstractmethod
    async def publish(self, stream: str, message: dict[str, Any]) -> None:
        ...

    @abstractmethod
    async def read(self, stream: str, last_id: str, count: int) -> list[dict[str, Any]]:
        ...


class RedisStreamBackend(EventBackend):
    def __init__(self, redis_url: str) -> None:
        self._redis_url = redis_url

    async def publish(self, stream: str, message: dict[str, Any]) -> None:
        client = Redis.from_url(self._redis_url, decode_responses=True)
        try:
            await client.xadd(stream, {"message": json.dumps(message)})
        finally:
            await client.aclose()

    async def read(self, stream: str, last_id: str, count: int) -> list[dict[str, Any]]:
        client = Redis.from_url(self._redis_url, decode_responses=True)
        try:
            entries = await client.xread({stream: last_id}, count=count, block=1000)
        finally:
            await client.aclose()

        results: list[dict[str, Any]] = []
        if not entries:
            return results
        for _, messages in entries:
            for msg_id, fields in messages:
                raw = fields.get("message", "{}")
                try:
                    parsed = json.loads(raw)
                except json.JSONDecodeError:
                    parsed = {"raw": raw}
                results.append({"id": msg_id, "data": parsed})
        return results

    async def health_check(self) -> dict[str, Any]:
        client = Redis.from_url(self._redis_url, decode_responses=True)
        try:
            pong = await client.ping()
            return {"status": "ok" if pong else "error", "backend": "redis"}
        except Exception as exc:  # noqa: BLE001
            return {"status": "error", "backend": "redis", "detail": str(exc)}
        finally:
            await client.aclose()


def get_event_backend() -> EventBackend:
    global _backend_instance
    if _backend_instance is None:
        backend = settings.event_backend.lower()
        if backend == "kafka":
            from app.services.kafka_backend import KafkaBackend

            _backend_instance = KafkaBackend()
        else:
            _backend_instance = RedisStreamBackend(settings.redis_url)
    return _backend_instance


async def start_event_backend() -> None:
    backend = get_event_backend()
    if hasattr(backend, "start"):
        await backend.start()


async def stop_event_backend() -> None:
    backend = get_event_backend()
    if hasattr(backend, "stop"):
        await backend.stop()


async def event_backend_health() -> dict[str, Any]:
    backend = get_event_backend()
    if hasattr(backend, "health_check"):
        return await backend.health_check()
    return {"status": "ok", "backend": settings.event_backend}
