import logging
from typing import Any

from app.models import Alert
from app.settings import settings

logger = logging.getLogger(__name__)


class OpenSearchAdapter:
    """Search indexing adapter with graceful degradation when OpenSearch is unavailable."""

    def __init__(self) -> None:
        self._enabled = bool(settings.opensearch_url)

    async def index_alert(self, alert: Alert) -> None:
        if not self._enabled:
            return
        doc = {
            "alert_id": alert.id,
            "agency_id": alert.agency_id,
            "source_system": alert.source_system,
            "event_type": alert.event_type,
            "severity": alert.severity,
            "threat_level": alert.threat_level,
            "title": alert.title,
            "summary": alert.summary,
            "correlation_id": alert.correlation_id,
            "officer_safety": alert.officer_safety,
            "geolocation": alert.geolocation,
            "entities": alert.entities,
            "threat_score": alert.threat_score,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
        }
        try:
            import httpx

            url = f"{settings.opensearch_url.rstrip('/')}/{settings.opensearch_index}/_doc/{alert.id}"
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.put(url, json=doc)
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenSearch indexing failed: %s", exc)

    async def search(self, query: dict[str, Any]) -> dict[str, Any]:
        if not self._enabled:
            return {"hits": [], "total": 0, "backend": "disabled"}
        try:
            import httpx

            url = f"{settings.opensearch_url.rstrip('/')}/{settings.opensearch_index}/_search"
            body = self._build_query(query)
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()
                hits = [h["_source"] for h in data.get("hits", {}).get("hits", [])]
                return {"hits": hits, "total": data.get("hits", {}).get("total", {}).get("value", 0), "backend": "opensearch"}
        except Exception as exc:  # noqa: BLE001
            logger.warning("OpenSearch search failed: %s", exc)
            return {"hits": [], "total": 0, "error": str(exc)}

    def _build_query(self, query: dict[str, Any]) -> dict[str, Any]:
        must: list[dict] = [{"term": {"agency_id": query["agency_id"]}}]
        if query.get("query"):
            must.append({"multi_match": {"query": query["query"], "fields": ["title", "summary", "event_type"]}})
        if query.get("threat_level"):
            must.append({"term": {"threat_level": query["threat_level"]}})
        if query.get("event_type"):
            must.append({"term": {"event_type": query["event_type"]}})
        filter_clauses: list[dict] = []
        if query.get("from_time") or query.get("to_time"):
            range_q: dict = {}
            if query.get("from_time"):
                range_q["gte"] = query["from_time"]
            if query.get("to_time"):
                range_q["lte"] = query["to_time"]
            filter_clauses.append({"range": {"created_at": range_q}})
        if query.get("lat") and query.get("lon") and query.get("radius_km"):
            filter_clauses.append(
                {
                    "geo_distance": {
                        "distance": f"{query['radius_km']}km",
                        "geolocation": {"lat": query["lat"], "lon": query["lon"]},
                    }
                }
            )
        return {"size": query.get("limit", 50), "query": {"bool": {"must": must, "filter": filter_clauses}}}


opensearch_adapter = OpenSearchAdapter()
