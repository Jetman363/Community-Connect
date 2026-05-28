import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Awaitable, Callable, TypeVar

from app.settings import settings

logger = logging.getLogger(__name__)
T = TypeVar("T")


class ConnectorHealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class RawFeedEvent:
    source_system: str
    event_type: str
    payload: dict[str, Any]
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    headers: dict[str, str] = field(default_factory=dict)


@dataclass
class HealthReport:
    status: ConnectorHealthStatus
    message: str
    details: dict[str, Any] = field(default_factory=dict)


class BaseAlertConnector(ABC):
    connector_type: str = "base"
    display_name: str = "Base Connector"
    supports_webhook: bool = False
    supports_polling: bool = False
    supports_stream: bool = False

    def __init__(self, agency_id: str, config: dict[str, Any], credentials: dict[str, str]) -> None:
        self.agency_id = agency_id
        self.config = config
        self.credentials = credentials
        self._circuit_open = False
        self._failure_count = 0

    @abstractmethod
    async def authenticate(self) -> dict[str, Any]:
        ...

    @abstractmethod
    async def normalize(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> list[RawFeedEvent]:
        ...

    async def poll(self) -> list[RawFeedEvent]:
        return []

    async def stream(self) -> list[RawFeedEvent]:
        return []

    async def health_check(self) -> HealthReport:
        try:
            await self.authenticate()
            return HealthReport(status=ConnectorHealthStatus.HEALTHY, message="OK")
        except Exception as exc:  # noqa: BLE001
            return HealthReport(status=ConnectorHealthStatus.UNHEALTHY, message=str(exc))

    def _record_failure(self) -> None:
        self._failure_count += 1
        if self._failure_count >= 5:
            self._circuit_open = True
            logger.warning("Circuit open for %s", self.connector_type)

    def _record_success(self) -> None:
        self._failure_count = 0
        self._circuit_open = False

    async def with_retry(self, operation: str, fn: Callable[[], Awaitable[T]]) -> T:
        if self._circuit_open:
            raise RuntimeError(f"Circuit breaker open for {self.connector_type}")
        attempts = settings.max_retry_attempts if hasattr(settings, "max_retry_attempts") else 5
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                result = await fn()
                self._record_success()
                return result
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                self._record_failure()
                if attempt >= attempts:
                    raise
                await asyncio.sleep(min(2 ** (attempt - 1), 30))
        raise last_error  # type: ignore[misc]
