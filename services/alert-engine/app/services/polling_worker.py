import asyncio
import logging
from typing import Any

from app.connectors.registry import connector_registry
from app.db import SessionLocal
from app.services.ingestion import ingestion_service

logger = logging.getLogger(__name__)


class PollingWorker:
    """Background polling for connector instances registered in-memory."""

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._running = False
        self._connectors: list[dict[str, Any]] = []

    def register(self, connector_type: str, agency_id: str, config: dict, credentials: dict, interval: int = 60) -> None:
        self._connectors.append(
            {"connector_type": connector_type, "agency_id": agency_id, "config": config, "credentials": credentials, "interval": interval}
        )

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Alert polling worker started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _loop(self) -> None:
        while self._running:
            for conn in self._connectors:
                try:
                    await self._poll_one(conn)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Poll failed for %s: %s", conn.get("connector_type"), exc)
            await asyncio.sleep(30)

    async def _poll_one(self, conn: dict[str, Any]) -> None:
        connector = connector_registry.instantiate(
            conn["connector_type"], conn["agency_id"], conn["config"], conn["credentials"]
        )
        if not connector.supports_polling:
            return
        feeds = await connector.with_retry("poll", connector.poll)
        async with SessionLocal() as session:
            for feed in feeds:
                await ingestion_service.ingest_raw_feed(session, conn["agency_id"], feed)


polling_worker = PollingWorker()
