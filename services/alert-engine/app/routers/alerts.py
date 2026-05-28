from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.repository import alert_repository, audit_repository
from app.schemas import AcknowledgeRequest, AlertResponse
from app.security.jwt import get_agency_id, get_roles, get_user_id, require_principal
from app.security.rbac import rbac

router = APIRouter()


def _to_response(alert) -> AlertResponse:
    return AlertResponse(
        id=alert.id,
        agency_id=alert.agency_id,
        source_system=alert.source_system,
        event_type=alert.event_type,
        severity=alert.severity,
        threat_level=alert.threat_level,
        title=alert.title,
        summary=alert.summary,
        correlation_id=alert.correlation_id,
        officer_safety=alert.officer_safety,
        geolocation=alert.geolocation,
        entities=alert.entities or [],
        normalized_payload=alert.normalized_payload or {},
        ai_enrichment=alert.ai_enrichment or {},
        threat_score=alert.threat_score,
        status=alert.status,
        escalated=alert.escalated,
        created_at=alert.created_at,
    )


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    threat_level: str | None = None,
    limit: int = 50,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> list[AlertResponse]:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:read", agency_id, agency_id)
    alerts = await alert_repository.list_alerts(session, agency_id, threat_level, limit)
    visible = [a for a in alerts if rbac.can_view_threat_level(roles, a.threat_level)]
    await audit_repository.log(session, get_user_id(principal), agency_id, "alert.list", "alert", agency_id, "success")
    return [_to_response(a) for a in visible]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> AlertResponse:
    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    rbac.authorize(roles, "alert:read", agency_id, agency_id)
    alert = await alert_repository.get_alert(session, alert_id)
    if not alert or alert.agency_id != agency_id:
        raise HTTPException(status_code=404, detail="Alert not found")
    if not rbac.can_view_threat_level(roles, alert.threat_level):
        raise HTTPException(status_code=403, detail="Insufficient clearance for this threat level")
    await audit_repository.log(session, get_user_id(principal), agency_id, "alert.access", "alert", alert_id, "success")
    return _to_response(alert)


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    body: AcknowledgeRequest,
    principal: dict = Depends(require_principal),
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    from app.repository import acknowledgement_repository

    roles = get_roles(principal)
    agency_id = get_agency_id(principal)
    user_id = get_user_id(principal)
    permission = "alert:escalate" if body.action == "escalate" else "alert:acknowledge"
    rbac.authorize(roles, permission, agency_id, agency_id)
    if body.action == "escalate" and not rbac.can_escalate(roles):
        raise HTTPException(status_code=403, detail="Escalation requires supervisor role")
    alert = await alert_repository.get_alert(session, alert_id)
    if not alert or alert.agency_id != agency_id:
        raise HTTPException(status_code=404, detail="Alert not found")
    await acknowledgement_repository.create(
        session,
        {"alert_id": alert_id, "user_id": user_id, "agency_id": agency_id, "action": body.action, "notes": body.notes},
    )
    if body.action == "escalate":
        await alert_repository.update_alert(session, alert, escalated=True, status="escalated")
    elif body.action == "dismiss":
        await alert_repository.update_alert(session, alert, status="dismissed")
    else:
        await alert_repository.update_alert(session, alert, status="acknowledged")
    await audit_repository.log(
        session, user_id, agency_id, f"alert.{body.action}", "alert", alert_id, "success", {"notes": body.notes}
    )
    return {"status": "ok", "action": body.action}
