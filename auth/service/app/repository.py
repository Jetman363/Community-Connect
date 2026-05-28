from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OutboxEvent, User


class UserRepository:
    async def create_user(
        self,
        session: AsyncSession,
        agency_id: UUID,
        username: str,
        password_hash: str,
        first_name: str | None,
        last_name: str | None,
        role: str | None,
        rank: str | None,
    ) -> User:
        user = User(
            id=uuid4(),
            agency_id=agency_id,
            username=username.lower(),
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            role=role,
            rank=rank,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    async def get_by_username(self, session: AsyncSession, username: str) -> User | None:
        stmt = select(User).where(User.username == username.lower())
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def append_outbox_event(self, session: AsyncSession, topic: str, payload: dict) -> OutboxEvent:
        evt = OutboxEvent(topic=topic, payload=payload, dispatched=False)
        session.add(evt)
        await session.commit()
        await session.refresh(evt)
        return evt

    async def get_pending_outbox(self, session: AsyncSession) -> list[OutboxEvent]:
        stmt = select(OutboxEvent).where(OutboxEvent.dispatched.is_(False)).order_by(OutboxEvent.id.asc())
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def mark_outbox_dispatched(self, session: AsyncSession, event_id: int) -> OutboxEvent | None:
        stmt = select(OutboxEvent).where(OutboxEvent.id == event_id)
        res = await session.execute(stmt)
        evt = res.scalar_one_or_none()
        if not evt:
            return None
        if evt.dispatched:
            return evt
        evt.dispatched = True
        evt.dispatched_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(evt)
        return evt


user_repository = UserRepository()
