import logging

from app.schemas import UnifiedEvent
from app.settings import settings

logger = logging.getLogger(__name__)


class Neo4jIntegrationHooks:
    """Graph database hooks for entity linking — no-op when Neo4j is not configured."""

    def __init__(self) -> None:
        self._enabled = bool(settings.neo4j_uri)

    async def link_entities(self, event: UnifiedEvent) -> None:
        if not self._enabled or not event.entities:
            return
        cypher_nodes = []
        for entity in event.entities:
            etype = entity.get("type", "unknown")
            cypher_nodes.append({"label": etype.title(), "props": entity})
        logger.debug(
            "Neo4j entity link hook",
            extra={"correlation_id": event.correlation_id, "nodes": len(cypher_nodes)},
        )
        # Production deployment wires neo4j async driver here.


neo4j_hooks = Neo4jIntegrationHooks()
