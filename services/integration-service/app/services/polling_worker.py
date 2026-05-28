import asyncio
import logging
from sqlalchemy import select

from app.db import SessionLocal
from app.models import ConnectorInstance
from app.repository import connector_repository
from app.connectors.registry import connector_registry
from app.services.credential_loader import load_connector_credentials
from app.services.event_queue import event_queue_service
from app.settings import settings

logger = logging.getLogger(__name__)


class PollingWorker:
    """Background worker that polls enabled connectors on configured intervals."""

    def __init__(self) -> None:
        self._running = False
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Polling worker started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Polling worker stopped")

    async def _loop(self) -> None:
        while self._running:
            try:
                await self._poll_all()
            except Exception as exc:  # noqa: BLE001
                logger.exception("Polling cycle failed: %s", exc)
            await asyncio.sleep(settings.poll_interval_seconds)

    async def _poll_all(self) -> None:
        async with SessionLocal() as session:
            res = await session.execute(
                select(ConnectorInstance).where(
                    ConnectorInstance.enabled.is_(True),
                    ConnectorInstance.poll_enabled.is_(True),
                )
            )
            connectors = list(res.scalars().all())

        for instance in connectors:
            try:
                async with SessionLocal() as session:
                    creds = await load_connector_credentials(session, instance.id)
                    connector = connector_registry.instantiate(
                        instance.connector_type, instance.id, instance.agency_id, instance.config, creds
                    )
                    events = await connector.with_retry("background_poll", connector.poll)
                    count = await event_queue_service.publish_events(
                        instance.agency_id, [e.to_dict() for e in events]
                    )
                    if events:
                        latest = max((e.occurred_at for e in events if e.occurred_at), default=None)
                        if latest:
                            config = dict(instance.config)
                            config["poll_since"] = latest
                            await connector_repository.update(session, instance.id, {"config": config})
                    await connector_repository.update_health(session, instance.id, "healthy")
                    if count:
                        logger.info("Polled %s: %d events", instance.id, count)
            except Exception as exc:  # noqa: BLE001
                async with SessionLocal() as session:
                    await connector_repository.update_health(session, instance.id, "unhealthy", str(exc))
                logger.warning("Poll failed for %s: %s", instance.id, exc)


polling_worker = PollingWorker()
