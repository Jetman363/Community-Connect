from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminAuditLog, Personnel, User


class AdminRepository:
    async def list_users(self, session: AsyncSession, agency_id: UUID, q: str | None = None) -> list[User]:
        stmt = select(User).where(User.agency_id == agency_id).order_by(User.created_at.desc())
        if q:
            like = f"%{q.lower()}%"
            stmt = stmt.where(
                or_(
                    User.username.ilike(like),
                    User.first_name.ilike(like),
                    User.last_name.ilike(like),
                )
            )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_user(self, session: AsyncSession, user_id: UUID) -> User | None:
        res = await session.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()

    async def update_user(self, session: AsyncSession, user: User, **fields) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(user)
        return user

    async def delete_user(self, session: AsyncSession, user: User) -> None:
        await session.delete(user)
        await session.commit()

    async def reset_password(self, session: AsyncSession, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        user.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(user)
        return user

    async def create_personnel(self, session: AsyncSession, data: dict) -> Personnel:
        record = Personnel(id=uuid4(), **data)
        session.add(record)
        await session.commit()
        await session.refresh(record)
        return record

    async def list_personnel(
        self,
        session: AsyncSession,
        agency_id: UUID,
        q: str | None = None,
        unit: str | None = None,
    ) -> list[Personnel]:
        stmt = select(Personnel).where(Personnel.agency_id == agency_id).order_by(Personnel.last_name.asc())
        if unit:
            stmt = stmt.where(Personnel.unit == unit)
        if q:
            like = f"%{q.lower()}%"
            stmt = stmt.where(
                or_(
                    Personnel.badge_id.ilike(like),
                    Personnel.first_name.ilike(like),
                    Personnel.last_name.ilike(like),
                    Personnel.unit.ilike(like),
                )
            )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_personnel(self, session: AsyncSession, personnel_id: UUID) -> Personnel | None:
        res = await session.execute(select(Personnel).where(Personnel.id == personnel_id))
        return res.scalar_one_or_none()

    async def update_personnel(self, session: AsyncSession, record: Personnel, **fields) -> Personnel:
        for key, value in fields.items():
            if value is not None:
                setattr(record, key, value)
        record.updated_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(record)
        return record

    async def log_audit(
        self,
        session: AsyncSession,
        *,
        agency_id: UUID,
        actor_id: str,
        actor_username: str | None,
        action: str,
        resource_type: str,
        resource_id: str | None,
        before_state: dict | None,
        after_state: dict | None,
        ip_address: str | None,
        user_agent: str | None,
        status: str = "success",
    ) -> AdminAuditLog:
        entry = AdminAuditLog(
            agency_id=agency_id,
            actor_id=actor_id,
            actor_username=actor_username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
        )
        session.add(entry)
        await session.commit()
        await session.refresh(entry)
        return entry

    async def list_audit_logs(
        self,
        session: AsyncSession,
        agency_id: UUID,
        action: str | None = None,
        resource_type: str | None = None,
        actor_id: str | None = None,
        limit: int = 100,
    ) -> list[AdminAuditLog]:
        stmt = (
            select(AdminAuditLog)
            .where(AdminAuditLog.agency_id == agency_id)
            .order_by(AdminAuditLog.created_at.desc())
            .limit(min(limit, 500))
        )
        if action:
            stmt = stmt.where(AdminAuditLog.action == action)
        if resource_type:
            stmt = stmt.where(AdminAuditLog.resource_type == resource_type)
        if actor_id:
            stmt = stmt.where(AdminAuditLog.actor_id == actor_id)
        res = await session.execute(stmt)
        return list(res.scalars().all())


admin_repository = AdminRepository()
