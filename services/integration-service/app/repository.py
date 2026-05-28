import json
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    AgencyPermission,
    ConnectorInstance,
    EncryptedCredential,
    IntegrationAuditLog,
    OAuth2Token,
    WebhookDelivery,
)
from app.security.encryption import credential_encryption


class ConnectorRepository:
    async def create(self, session: AsyncSession, data: dict) -> ConnectorInstance:
        instance = ConnectorInstance(id=str(uuid4()), **data)
        session.add(instance)
        await session.commit()
        await session.refresh(instance)
        return instance

    async def get(self, session: AsyncSession, connector_id: str) -> ConnectorInstance | None:
        res = await session.execute(select(ConnectorInstance).where(ConnectorInstance.id == connector_id))
        return res.scalar_one_or_none()

    async def list_by_agency(self, session: AsyncSession, agency_id: str) -> list[ConnectorInstance]:
        res = await session.execute(
            select(ConnectorInstance).where(ConnectorInstance.agency_id == agency_id).order_by(ConnectorInstance.created_at.desc())
        )
        return list(res.scalars().all())

    async def update_health(
        self, session: AsyncSession, connector_id: str, status: str, error: str | None = None
    ) -> None:
        instance = await self.get(session, connector_id)
        if not instance:
            return
        instance.health_status = status
        instance.last_health_check = datetime.now(timezone.utc)
        instance.last_error = error
        await session.commit()

    async def update(self, session: AsyncSession, connector_id: str, fields: dict) -> ConnectorInstance | None:
        instance = await self.get(session, connector_id)
        if not instance:
            return None
        for key, value in fields.items():
            if value is not None and hasattr(instance, key):
                setattr(instance, key, value)
        instance.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(instance)
        return instance

    async def delete(self, session: AsyncSession, connector_id: str) -> bool:
        instance = await self.get(session, connector_id)
        if not instance:
            return False
        await session.execute(delete(EncryptedCredential).where(EncryptedCredential.connector_id == connector_id))
        await session.execute(delete(OAuth2Token).where(OAuth2Token.connector_id == connector_id))
        await session.execute(delete(AgencyPermission).where(AgencyPermission.connector_id == connector_id))
        await session.execute(delete(WebhookDelivery).where(WebhookDelivery.connector_id == connector_id))
        await session.delete(instance)
        await session.commit()
        return True


class CredentialRepository:
    async def store(self, session: AsyncSession, connector_id: str, cred_type: str, value: str, expires_at=None) -> EncryptedCredential:
        encrypted = credential_encryption.encrypt(value)
        cred = EncryptedCredential(
            connector_id=connector_id,
            credential_type=cred_type,
            encrypted_value=encrypted,
            expires_at=expires_at,
        )
        session.add(cred)
        await session.commit()
        await session.refresh(cred)
        return cred

    async def get_decrypted(self, session: AsyncSession, connector_id: str) -> dict[str, str]:
        res = await session.execute(
            select(EncryptedCredential).where(EncryptedCredential.connector_id == connector_id)
        )
        creds = {}
        for row in res.scalars().all():
            creds[row.credential_type] = credential_encryption.decrypt(row.encrypted_value)
        return creds

    async def list_metadata(self, session: AsyncSession, connector_id: str) -> list[EncryptedCredential]:
        res = await session.execute(
            select(EncryptedCredential).where(EncryptedCredential.connector_id == connector_id)
        )
        return list(res.scalars().all())

    async def delete(self, session: AsyncSession, credential_id: int) -> bool:
        res = await session.execute(select(EncryptedCredential).where(EncryptedCredential.id == credential_id))
        cred = res.scalar_one_or_none()
        if not cred:
            return False
        await session.delete(cred)
        await session.commit()
        return True

    async def rotate(
        self, session: AsyncSession, credential_id: int, new_value: str
    ) -> EncryptedCredential | None:
        res = await session.execute(select(EncryptedCredential).where(EncryptedCredential.id == credential_id))
        cred = res.scalar_one_or_none()
        if not cred:
            return None
        cred.encrypted_value = credential_encryption.encrypt(new_value)
        cred.rotated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(cred)
        return cred


class WebhookRepository:
    async def record(
        self, session: AsyncSession, connector_id: str, agency_id: str, event_type: str, payload_hash: str, status: str
    ) -> WebhookDelivery:
        delivery = WebhookDelivery(
            connector_id=connector_id,
            agency_id=agency_id,
            event_type=event_type,
            payload_hash=payload_hash,
            status=status,
        )
        session.add(delivery)
        await session.commit()
        await session.refresh(delivery)
        return delivery

    async def mark_processed(self, session: AsyncSession, delivery_id: int, status: str, error: str | None = None) -> None:
        res = await session.execute(select(WebhookDelivery).where(WebhookDelivery.id == delivery_id))
        delivery = res.scalar_one_or_none()
        if delivery:
            delivery.status = status
            delivery.processed_at = datetime.now(timezone.utc)
            delivery.error_message = error
            await session.commit()


class PermissionRepository:
    async def grant(self, session: AsyncSession, agency_id: str, connector_id: str, role: str, granted_by: str) -> AgencyPermission:
        perm = AgencyPermission(agency_id=agency_id, connector_id=connector_id, role=role, granted_by=granted_by)
        session.add(perm)
        await session.commit()
        await session.refresh(perm)
        return perm

    async def list_for_agency(self, session: AsyncSession, agency_id: str) -> list[AgencyPermission]:
        res = await session.execute(select(AgencyPermission).where(AgencyPermission.agency_id == agency_id))
        return list(res.scalars().all())

    async def list_for_connector(self, session: AsyncSession, connector_id: str) -> list[AgencyPermission]:
        res = await session.execute(select(AgencyPermission).where(AgencyPermission.connector_id == connector_id))
        return list(res.scalars().all())

    async def revoke(self, session: AsyncSession, permission_id: int) -> bool:
        res = await session.execute(select(AgencyPermission).where(AgencyPermission.id == permission_id))
        perm = res.scalar_one_or_none()
        if not perm:
            return False
        await session.delete(perm)
        await session.commit()
        return True


class AuditRepository:
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
    ) -> IntegrationAuditLog:
        entry = IntegrationAuditLog(
            actor_id=actor_id,
            agency_id=agency_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            event_metadata=metadata or {},
        )
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
        return entry

    async def list_recent(self, session: AsyncSession, agency_id: str, limit: int = 50) -> list[IntegrationAuditLog]:
        res = await session.execute(
            select(IntegrationAuditLog)
            .where(IntegrationAuditLog.agency_id == agency_id)
            .order_by(IntegrationAuditLog.created_at.desc())
            .limit(limit)
        )
        return list(res.scalars().all())


class OAuth2Repository:
    async def store_token(
        self,
        session: AsyncSession,
        connector_id: str,
        access_token: str,
        refresh_token: str | None,
        expires_at: datetime,
        scopes: list[str],
    ) -> OAuth2Token:
        token = OAuth2Token(
            connector_id=connector_id,
            access_token_encrypted=credential_encryption.encrypt(access_token),
            refresh_token_encrypted=credential_encryption.encrypt(refresh_token) if refresh_token else None,
            expires_at=expires_at,
            scopes=scopes,
        )
        session.add(token)
        await session.commit()
        await session.refresh(token)
        return token

    async def get_latest(self, session: AsyncSession, connector_id: str) -> OAuth2Token | None:
        res = await session.execute(
            select(OAuth2Token)
            .where(OAuth2Token.connector_id == connector_id)
            .order_by(OAuth2Token.created_at.desc())
            .limit(1)
        )
        return res.scalar_one_or_none()


connector_repository = ConnectorRepository()
credential_repository = CredentialRepository()
webhook_repository = WebhookRepository()
permission_repository = PermissionRepository()
audit_repository = AuditRepository()
oauth2_repository = OAuth2Repository()
