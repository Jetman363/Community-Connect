from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import alert_repository, audit_repository
from app.schemas import AlertResponse, SearchQuery
from app.security.jwt import get_agency_id, get_roles, get_user_id, require_principal
from app.security.rbac import rbac
from app.services.opensearch_adapter import opensearch_adapter

router = APIRouter()


@router.post("/search")
async def search_alerts(
    body: SearchQuery,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:search", agency_id, body.agency_id)
    os_result = await opensearch_adapter.search(body.model_dump(mode="json"))
    if os_result.get("hits"):
        await audit_repository.log(session, get_user_id(principal), agency_id, "alert.search", "alert", agency_id, "success")
        return os_result
    alerts = await alert_repository.list_alerts(session, body.agency_id, body.threat_level.value if body.threat_level else None, body.limit)
    hits = [
        AlertResponse(
            id=a.id,
            agency_id=a.agency_id,
            source_system=a.source_system,
            event_type=a.event_type,
            severity=a.severity,
            threat_level=a.threat_level,
            title=a.title,
            summary=a.summary,
            correlation_id=a.correlation_id,
            officer_safety=a.officer_safety,
            geolocation=a.geolocation,
            entities=a.entities or [],
            normalized_payload=a.normalized_payload or {},
            ai_enrichment=a.ai_enrichment or {},
            threat_score=a.threat_score,
            status=a.status,
            escalated=a.escalated,
            created_at=a.created_at,
        ).model_dump(mode="json")
        for a in alerts
        if rbac.can_view_threat_level(roles, a.threat_level)
    ]
    return {"hits": hits, "total": len(hits), "backend": "postgres_fallback"}


@router.get("/timeline")
async def alert_timeline(
    hours: int = 24,
    limit: int = 100,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:search", agency_id, agency_id)
    alerts = await alert_repository.list_alerts(session, agency_id, limit=limit)
    visible = [a for a in alerts if rbac.can_view_threat_level(roles, a.threat_level)]
    return {
        "agency_id": agency_id,
        "window_hours": hours,
        "events": [{"id": a.id, "event_type": a.event_type, "threat_level": a.threat_level, "created_at": a.created_at.isoformat()} for a in visible],
    }
