import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repository import (
    alert_event_repository,
    alert_repository,
    audit_repository,
    routing_rule_repository,
    subscription_repository,
    threat_score_repository,
)
from app.schemas import UnifiedEvent
from app.services.correlation import correlation_engine
from app.services.distribution import distribution_service
from app.services.rule_engine import rule_engine
from app.services.threat_engine import threat_engine

logger = logging.getLogger(__name__)


class AlertProcessor:
    """End-to-end pipeline: correlate → score → persist → distribute."""

    async def process(self, session: AsyncSession, event: UnifiedEvent, actor_id: str | None = None) -> dict:
        existing = await alert_event_repository.get_by_event_id(session, event.event_id)
        if existing:
            return {"status": "duplicate", "event_id": event.event_id}

        event = correlation_engine.correlate(event)
        rules = await routing_rule_repository.list_enabled(session, event.agency_id)
        rule_hits = rule_engine.evaluate(event, rules)
        threat = threat_engine.evaluate(event, rules)

        await alert_event_repository.create(
            session,
            {
                "event_id": event.event_id,
                "agency_id": event.agency_id,
                "source_system": event.source_system,
                "event_type": event.event_type,
                "severity": event.severity,
                "timestamp": event.timestamp,
                "geolocation": event.geolocation,
                "entities": event.entities,
                "raw_payload": event.raw_payload,
                "normalized_payload": event.normalized_payload,
                "ai_enrichment": {**event.ai_enrichment, "rule_hits": rule_hits},
                "correlation_id": event.correlation_id,
            },
        )

        title = self._build_title(event)
        summary = event.normalized_payload.get("summary") or event.event_type

        alert = await alert_repository.create_alert(
            session,
            {
                "agency_id": event.agency_id,
                "source_system": event.source_system,
                "event_type": event.event_type,
                "severity": event.severity,
                "threat_level": threat.threat_level.value,
                "title": title,
                "summary": summary,
                "correlation_id": event.correlation_id,
                "officer_safety": threat.officer_safety,
                "geolocation": event.geolocation,
                "entities": event.entities,
                "normalized_payload": event.normalized_payload,
                "ai_enrichment": {**event.ai_enrichment, "rule_hits": rule_hits},
                "threat_score": threat.score,
                "escalated": threat.escalated,
            },
        )

        await threat_score_repository.create(
            session,
            {
                "alert_id": alert.id,
                "score": threat.score,
                "threat_level": threat.threat_level.value,
                "factors": threat.factors,
                "rule_hits": threat.rule_hits,
            },
        )

        subs = await subscription_repository.list_for_agency(session, event.agency_id)
        delivered = await distribution_service.route_to_subscribers(alert, subs)
        await distribution_service.publish_alert(alert)

        from app.services.opensearch_adapter import opensearch_adapter
        from app.services.neo4j_hooks import neo4j_hooks

        await opensearch_adapter.index_alert(alert)
        await neo4j_hooks.link_entities(event)

        await audit_repository.log(
            session,
            actor_id=actor_id,
            agency_id=event.agency_id,
            action="alert.created",
            resource_type="alert",
            resource_id=alert.id,
            outcome="success",
            metadata={"threat_level": alert.threat_level, "delivered_to": delivered},
        )

        logger.info("Alert processed", extra={"alert_id": alert.id, "threat_level": alert.threat_level})
        return {"status": "created", "alert_id": alert.id, "threat_level": alert.threat_level}

    @staticmethod
    def _build_title(event: UnifiedEvent) -> str:
        if event.normalized_payload.get("summary"):
            return str(event.normalized_payload["summary"])[:512]
        if event.raw_payload.get("plate"):
            return f"{event.event_type}: {event.raw_payload['plate']}"
        return event.event_type.replace(".", " ").title()


alert_processor = AlertProcessor()
