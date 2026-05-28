import hashlib
import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Alert,
    AlertAcknowledgement,
    AlertEvent,
    AlertSubscription,
    AuditLog,
    RoutingRule,
    ThreatScore,
)


class AlertRepository:
    async def create_alert(self, session: AsyncSession, data: dict) -> Alert:
        alert = Alert(id=str(uuid4()), **data)
        session.add(alert)
        await session.commit()
        await session.refresh(alert)
        return alert

    async def get_alert(self, session: AsyncSession, alert_id: str) -> Alert | None:
        res = await session.execute(select(Alert).where(Alert.id == alert_id))
        return res.scalar_one_or_none()

    async def list_alerts(
        self,
        session: AsyncSession,
        agency_id: str,
        threat_level: str | None = None,
        limit: int = 50,
    ) -> list[Alert]:
        stmt = select(Alert).where(Alert.agency_id == agency_id).order_by(Alert.created_at.desc()).limit(limit)
        if threat_level:
            stmt = stmt.where(Alert.threat_level == threat_level)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def update_alert(self, session: AsyncSession, alert: Alert, **fields) -> Alert:
        for key, value in fields.items():
            if value is not None:
                setattr(alert, key, value)
        alert.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(alert)
        return alert


class AlertEventRepository:
    async def create(self, session: AsyncSession, data: dict) -> AlertEvent:
        event = AlertEvent(**data)
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event

    async def get_by_event_id(self, session: AsyncSession, event_id: str) -> AlertEvent | None:
        res = await session.execute(select(AlertEvent).where(AlertEvent.event_id == event_id))
        return res.scalar_one_or_none()


class SubscriptionRepository:
    async def create(self, session: AsyncSession, data: dict) -> AlertSubscription:
        sub = AlertSubscription(**data)
        session.add(sub)
        await session.commit()
        await session.refresh(sub)
        return sub

    async def list_for_agency(self, session: AsyncSession, agency_id: str) -> list[AlertSubscription]:
        res = await session.execute(
            select(AlertSubscription).where(AlertSubscription.agency_id == agency_id, AlertSubscription.active.is_(True))
        )
        return list(res.scalars().all())


class AcknowledgementRepository:
    async def create(self, session: AsyncSession, data: dict) -> AlertAcknowledgement:
        ack = AlertAcknowledgement(**data)
        session.add(ack)
        await session.commit()
        await session.refresh(ack)
        return ack


class ThreatScoreRepository:
    async def create(self, session: AsyncSession, data: dict) -> ThreatScore:
        score = ThreatScore(**data)
        session.add(score)
        await session.commit()
        await session.refresh(score)
        return score


class RoutingRuleRepository:
    async def create(self, session: AsyncSession, data: dict) -> RoutingRule:
        rule = RoutingRule(**data)
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return rule

    async def list_enabled(self, session: AsyncSession, agency_id: str) -> list[RoutingRule]:
        res = await session.execute(
            select(RoutingRule)
            .where(RoutingRule.agency_id == agency_id, RoutingRule.enabled.is_(True))
            .order_by(RoutingRule.priority.asc())
        )
        return list(res.scalars().all())

    async def list_all(self, session: AsyncSession, agency_id: str) -> list[RoutingRule]:
        res = await session.execute(
            select(RoutingRule).where(RoutingRule.agency_id == agency_id).order_by(RoutingRule.priority.asc())
        )
        return list(res.scalars().all())

    async def get(self, session: AsyncSession, rule_id: str | int) -> RoutingRule | None:
        rid = int(rule_id) if isinstance(rule_id, str) else rule_id
        res = await session.execute(select(RoutingRule).where(RoutingRule.id == rid))
        return res.scalar_one_or_none()

    async def update(self, session: AsyncSession, rule: RoutingRule, **fields) -> RoutingRule:
        for key, value in fields.items():
            if value is not None:
                setattr(rule, key, value)
        await session.commit()
        await session.refresh(rule)
        return rule

    async def delete(self, session: AsyncSession, rule: RoutingRule) -> None:
        await session.delete(rule)
        await session.commit()


class AuditRepository:
    _last_hash: str | None = None

    async def log(
        self,
        session: AsyncSession,
        actor_id: str | None,
        agency_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        outcome: str,
        metadata: dict | None = None,
    ) -> AuditLog:
        canonical = json.dumps(
            {
                "actor_id": actor_id,
                "agency_id": agency_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "outcome": outcome,
                "metadata": metadata or {},
                "prev_hash": AuditRepository._last_hash,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
        entry_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        entry = AuditLog(
            actor_id=actor_id,
            agency_id=agency_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            event_metadata=metadata or {},
            hash_chain=entry_hash,
        )
        AuditRepository._last_hash = entry_hash
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
        return entry

    async def list_recent(self, session: AsyncSession, agency_id: str, limit: int = 100) -> list[AuditLog]:
        res = await session.execute(
            select(AuditLog).where(AuditLog.agency_id == agency_id).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(res.scalars().all())


alert_repository = AlertRepository()
alert_event_repository = AlertEventRepository()
subscription_repository = SubscriptionRepository()
acknowledgement_repository = AcknowledgementRepository()
threat_score_repository = ThreatScoreRepository()
routing_rule_repository = RoutingRuleRepository()
audit_repository = AuditRepository()
