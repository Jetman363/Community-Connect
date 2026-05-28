import asyncio
import base64
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
    UNKNOWN = "unknown"


@dataclass
class NormalizedEvent:
    source: str
    event_type: str
    agency_id: str
    connector_id: str
    occurred_at: str
    payload: dict[str, Any]
    external_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "event_type": self.event_type,
            "agency_id": self.agency_id,
            "connector_id": self.connector_id,
            "occurred_at": self.occurred_at,
            "external_id": self.external_id,
            "payload": self.payload,
            "metadata": self.metadata,
        }


@dataclass
class HealthReport:
    status: ConnectorHealthStatus
    message: str
    checked_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: dict[str, Any] = field(default_factory=dict)


class BaseConnector(ABC):
    connector_type: str = "base"
    display_name: str = "Base Connector"
    supported_auth: list[str] = ["api_key"]
    supports_webhook: bool = False
    supports_polling: bool = False

    def __init__(self, connector_id: str, agency_id: str, config: dict[str, Any], credentials: dict[str, str]) -> None:
        self.connector_id = connector_id
        self.agency_id = agency_id
        self.config = config
        self.credentials = credentials

    @abstractmethod
    async def authenticate(self) -> dict[str, Any]:
        """Validate credentials and return auth context."""

    @abstractmethod
    async def normalize_webhook(self, payload: dict[str, Any], headers: dict[str, str]) -> list[NormalizedEvent]:
        """Transform inbound webhook payload into normalized events."""

    @abstractmethod
    async def poll(self) -> list[NormalizedEvent]:
        """Fetch new events from external API."""

    @abstractmethod
    async def health_check(self) -> HealthReport:
        """Report connector health status."""

    def resolve_bearer_token(self) -> str:
        for key in ("api_key", "oauth_token", "access_token"):
            value = self.credentials.get(key)
            if value:
                return value
        return ""

    def auth_bearer_headers(self) -> dict[str, str]:
        token = self.resolve_bearer_token()
        return {"Authorization": f"Bearer {token}"} if token else {}

    def auth_api_key_header(self, header_name: str = "X-API-Key") -> dict[str, str]:
        api_key = self.credentials.get("api_key") or self.resolve_bearer_token()
        return {header_name: api_key} if api_key else {}

    def auth_basic_headers(self) -> dict[str, str]:
        username = self.credentials.get("username", "")
        password = self.credentials.get("password", "")
        if not username:
            return {}
        token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("utf-8")
        return {"Authorization": f"Basic {token}"}

    def resolve_auth_headers(self) -> dict[str, str]:
        if self.credentials.get("username"):
            return self.auth_basic_headers()
        if self.credentials.get("api_key") and self.config.get("auth_header") == "X-API-Key":
            return self.auth_api_key_header()
        return self.auth_bearer_headers()

    async def verify_webhook_signature(self, payload: bytes, signature: str | None, secret: str | None) -> bool:
        if not secret or not signature:
            return False
        import hashlib
        import hmac

        expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def handle_error(self, error: Exception, context: str) -> None:
        logger.warning("Connector error [%s]: %s", context, error)
        raise error

    async def with_retry(
        self,
        operation: str,
        fn: Callable[[], Awaitable[T]],
        max_attempts: int | None = None,
    ) -> T:
        attempts = max_attempts or settings.max_retry_attempts
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                return await fn()
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if attempt >= attempts:
                    await self.handle_error(exc, f"{operation} failed after {attempts} attempts")
                delay = min(2 ** (attempt - 1), 30)
                logger.warning("%s attempt %d/%d failed: %s; retrying in %ss", operation, attempt, attempts, exc, delay)
                await asyncio.sleep(delay)
        raise last_error  # type: ignore[misc]
