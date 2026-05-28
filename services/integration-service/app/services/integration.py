from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.registry import connector_registry
from app.repository import audit_repository, connector_repository, permission_repository, webhook_repository
from app.schemas import ConnectorCreateRequest, ConnectorResponse, ConnectorUpdateRequest, WebhookIngestResponse
from app.services.credential_loader import load_connector_credentials
from app.services.event_queue import event_queue_service
from app.settings import settings


class ConnectorService:
    async def _instantiate(self, session: AsyncSession, instance):
        creds = await load_connector_credentials(session, instance.id)
        return connector_registry.instantiate(
            instance.connector_type, instance.id, instance.agency_id, instance.config, creds
        )

    async def create_connector(
        self, session: AsyncSession, req: ConnectorCreateRequest, actor_id: str
    ) -> ConnectorResponse:
        import secrets

        instance = await connector_repository.create(
            session,
            {
                "connector_type": req.connector_type,
                "name": req.name,
                "agency_id": req.agency_id,
                "config": req.config,
                "auth_type": req.auth_type,
                "poll_enabled": req.poll_enabled,
                "poll_interval_seconds": req.poll_interval_seconds,
                "webhook_secret": secrets.token_hex(32),
            },
        )
        await audit_repository.log(
            session, actor_id, req.agency_id, "connector.create", "connector", instance.id, "success"
        )
        return self._to_response(instance)

    async def update_connector(
        self, session: AsyncSession, connector_id: str, req: ConnectorUpdateRequest, actor_id: str
    ) -> ConnectorResponse:
        fields = req.model_dump(exclude_unset=True)
        instance = await connector_repository.update(session, connector_id, fields)
        if not instance:
            raise ValueError("Connector not found")
        await audit_repository.log(
            session, actor_id, instance.agency_id, "connector.update", "connector", connector_id, "success", fields
        )
        return self._to_response(instance)

    async def delete_connector(self, session: AsyncSession, connector_id: str, actor_id: str) -> None:
        instance = await connector_repository.get(session, connector_id)
        if not instance:
            raise ValueError("Connector not found")
        agency_id = instance.agency_id
        deleted = await connector_repository.delete(session, connector_id)
        if not deleted:
            raise ValueError("Connector not found")
        await audit_repository.log(session, actor_id, agency_id, "connector.delete", "connector", connector_id, "success")

    async def get_connector(self, session: AsyncSession, connector_id: str) -> ConnectorResponse | None:
        instance = await connector_repository.get(session, connector_id)
        return self._to_response(instance) if instance else None

    async def list_connectors(self, session: AsyncSession, agency_id: str) -> list[ConnectorResponse]:
        instances = await connector_repository.list_by_agency(session, agency_id)
        return [self._to_response(i) for i in instances]

    async def run_health_check(self, session: AsyncSession, connector_id: str) -> dict:
        instance = await connector_repository.get(session, connector_id)
        if not instance:
            raise ValueError("Connector not found")
        connector = await self._instantiate(session, instance)
        report = await connector.health_check()
        await connector_repository.update_health(session, connector_id, report.status.value, report.message)
        return {
            "connector_id": connector_id,
            "connector_type": instance.connector_type,
            "status": report.status.value,
            "message": report.message,
            "checked_at": report.checked_at,
            "details": report.details,
        }

    async def poll_connector(self, session: AsyncSession, connector_id: str) -> int:
        instance = await connector_repository.get(session, connector_id)
        if not instance or not instance.poll_enabled:
            raise ValueError("Connector not found or polling disabled")
        connector = await self._instantiate(session, instance)
        events = await connector.with_retry("manual_poll", connector.poll)
        published = await event_queue_service.publish_events(instance.agency_id, [e.to_dict() for e in events])
        if events:
            latest = max((e.occurred_at for e in events if e.occurred_at), default=None)
            if latest:
                config = dict(instance.config)
                config["poll_since"] = latest
                await connector_repository.update(session, connector_id, {"config": config})
        await connector_repository.update_health(session, connector_id, "healthy")
        await audit_repository.log(
            session, None, instance.agency_id, "connector.poll", "connector", connector_id, "success", {"events": published}
        )
        return published

    async def fleet_health_check(self, session: AsyncSession, agency_id: str) -> list[dict]:
        instances = await connector_repository.list_by_agency(session, agency_id)
        reports = []
        for instance in instances:
            try:
                reports.append(await self.run_health_check(session, instance.id))
            except ValueError as exc:
                reports.append(
                    {
                        "connector_id": instance.id,
                        "connector_type": instance.connector_type,
                        "status": "error",
                        "message": str(exc),
                        "checked_at": datetime.now(timezone.utc).isoformat(),
                        "details": {},
                    }
                )
        return reports

    async def assert_agency_permission(
        self, session: AsyncSession, agency_id: str, connector_id: str, roles: list[str]
    ) -> None:
        if "admin" in roles:
            return
        grants = await permission_repository.list_for_connector(session, connector_id)
        agency_grants = [g for g in grants if g.agency_id == agency_id]
        if not agency_grants:
            return
        granted_roles = {g.role for g in agency_grants}
        if not granted_roles.intersection(set(roles)):
            from fastapi import HTTPException

            raise HTTPException(status_code=403, detail="No agency permission grant for this connector")

    def list_connector_types(self) -> list[dict]:
        return connector_registry.list_types()

    def _to_response(self, instance) -> ConnectorResponse:
        webhook_url = f"{settings.webhook_base_url}/v1/webhooks/{instance.id}/ingest"
        return ConnectorResponse(
            id=instance.id,
            connector_type=instance.connector_type,
            name=instance.name,
            agency_id=instance.agency_id,
            enabled=instance.enabled,
            config=instance.config,
            auth_type=instance.auth_type,
            poll_enabled=instance.poll_enabled,
            poll_interval_seconds=instance.poll_interval_seconds,
            health_status=instance.health_status,
            last_health_check=instance.last_health_check,
            last_error=instance.last_error,
            webhook_url=webhook_url,
        )


class WebhookIngestionEngine:
    async def ingest(
        self,
        session: AsyncSession,
        connector_id: str,
        payload: dict,
        headers: dict[str, str],
        raw_body: bytes,
    ) -> WebhookIngestResponse:
        instance = await connector_repository.get(session, connector_id)
        if not instance or not instance.enabled:
            raise ValueError("Connector not found or disabled")

        signature = headers.get("x-webhook-signature") or headers.get("X-Webhook-Signature")
        connector = await connector_service._instantiate(session, instance)

        if instance.webhook_secret:
            if not signature:
                raise ValueError("Missing webhook signature")
            valid = await connector.verify_webhook_signature(raw_body, signature, instance.webhook_secret)
            if not valid:
                raise ValueError("Invalid webhook signature")

        import hashlib

        payload_hash = hashlib.sha256(raw_body).hexdigest()
        delivery = await webhook_repository.record(
            session, connector_id, instance.agency_id, payload.get("type", "webhook"), payload_hash, "processing"
        )

        try:
            events = await connector.with_retry(
                "webhook_normalize",
                lambda: connector.normalize_webhook(payload, headers),
            )
            published = await event_queue_service.publish_events(instance.agency_id, [e.to_dict() for e in events])
            await webhook_repository.mark_processed(session, delivery.id, "processed")
            await audit_repository.log(
                session, None, instance.agency_id, "webhook.ingest", "webhook", str(delivery.id), "success", {"events": published}
            )
            return WebhookIngestResponse(delivery_id=delivery.id, events_published=published, status="processed")
        except Exception as exc:  # noqa: BLE001
            await webhook_repository.mark_processed(session, delivery.id, "failed", str(exc))
            raise


connector_service = ConnectorService()
webhook_engine = WebhookIngestionEngine()
