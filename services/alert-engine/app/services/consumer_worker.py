import asyncio
import logging

from app.db import SessionLocal
from app.observability.metrics import INTEGRATION_EVENTS_CONSUMED
from app.services.alert_processor import alert_processor
from app.services.event_backend import get_event_backend
from app.services.ingress_parser import parse_ingress_message
from app.settings import settings

logger = logging.getLogger(__name__)


class ConsumerWorker:
    """Fault-tolerant queue consumer for ingress events."""

    def __init__(self) -> None:
        self._task: asyncio.Task | None = None
        self._running = False
        self._last_id = "0"

    async def start(self) -> None:
        if not settings.consumer_worker_enabled or self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Alert consumer worker started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Alert consumer worker stopped")

    async def _loop(self) -> None:
        backend = get_event_backend()
        while self._running:
            try:
                messages = await backend.read(settings.kafka_ingress_topic, self._last_id, count=10)
                if not messages:
                    await asyncio.sleep(0.5)
                    continue
                for msg in messages:
                    self._last_id = msg["id"]
                    data = msg.get("data", {})
                    if not data:
                        continue
                    await self._process_message(data)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                logger.exception("Consumer worker error: %s", exc)
                await asyncio.sleep(2)

    async def _process_message(self, data: dict) -> None:
        event = parse_ingress_message(data)
        if not event:
            return
        async with SessionLocal() as session:
            result = await alert_processor.process(session, event)
            if data.get("message_type") == "integration.normalized":
                INTEGRATION_EVENTS_CONSUMED.inc()
            if result.get("status") == "duplicate":
                logger.debug("Skipped duplicate event %s", event.event_id)


consumer_worker = ConsumerWorker()
