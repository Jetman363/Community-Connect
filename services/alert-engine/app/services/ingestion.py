import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.base import RawFeedEvent
from app.connectors.registry import connector_registry
from app.schemas import IngestEventRequest, UnifiedEvent
from app.services.alert_processor import alert_processor
from app.services.event_backend import get_event_backend
from app.services.normalization import normalization_service
from app.settings import settings

logger = logging.getLogger(__name__)


class IngestionService:
    """Multi-channel event ingestion: API, webhooks, connectors, queue."""

    async def ingest_api(self, session: AsyncSession, request: IngestEventRequest, actor_id: str | None = None) -> dict:
        event = normalization_service.from_api_request(request)
        await self._enqueue(event)
        return await alert_processor.process(session, event, actor_id=actor_id)

    async def ingest_webhook(
        self,
        session: AsyncSession,
        agency_id: str,
        connector_type: str,
        payload: dict,
        headers: dict[str, str] | None = None,
        credentials: dict[str, str] | None = None,
        config: dict | None = None,
    ) -> dict:
        connector = connector_registry.instantiate(connector_type, agency_id, config or {}, credentials or {})
        feeds = await connector.normalize(payload, headers)
        results: list[dict] = []
        for feed in feeds:
            event = normalization_service.from_raw_feed(agency_id, feed)
            await self._enqueue(event)
            results.append(await alert_processor.process(session, event))
        return {"processed": len(results), "results": results}

    async def ingest_raw_feed(self, session: AsyncSession, agency_id: str, feed: RawFeedEvent, actor_id: str | None = None) -> dict:
        event = normalization_service.from_raw_feed(agency_id, feed)
        await self._enqueue(event)
        return await alert_processor.process(session, event, actor_id=actor_id)

    async def ingest_unified(self, session: AsyncSession, event: UnifiedEvent, actor_id: str | None = None) -> dict:
        await self._enqueue(event)
        return await alert_processor.process(session, event, actor_id=actor_id)

    async def _enqueue(self, event: UnifiedEvent) -> None:
        backend = get_event_backend()
        await backend.publish(
            settings.kafka_ingress_topic,
            event.model_dump(mode="json"),
        )


ingestion_service = IngestionService()
