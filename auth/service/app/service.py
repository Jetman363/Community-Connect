from prometheus_client import Counter
import bcrypt
from shared_lib.event_bus import publisher
from shared_lib.security import create_jwt_token
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository import user_repository
from app.schemas import TokenResponse, UserCreateRequest, UserResponse
from app.settings import settings

AUTH_REGISTERED = Counter("auth_users_registered_total", "Total registered users")
AUTH_LOGIN_SUCCESS = Counter("auth_login_success_total", "Total successful logins")
AUTH_OUTBOX_DISPATCHED = Counter("auth_outbox_dispatched_total", "Total auth outbox events dispatched")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


class AuthDomainService:
    async def register(self, session: AsyncSession, req: UserCreateRequest) -> UserResponse:
        user = await user_repository.create_user(
            session=session,
            agency_id=req.agency_id,
            username=req.username,
            password_hash=_hash_password(req.password),
            first_name=req.first_name,
            last_name=req.last_name,
            role=req.role,
            rank=req.rank,
        )
        await user_repository.append_outbox_event(
            session,
            "auth.user.created.v1",
            {
                "user_id": str(user.id),
                "username": user.username,
                "role": user.role,
                "agency_id": str(user.agency_id),
            },
        )
        AUTH_REGISTERED.inc()
        return UserResponse(
            id=user.id,
            agency_id=user.agency_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            rank=user.rank,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    async def login(self, session: AsyncSession, username: str, password: str) -> TokenResponse:
        user = await user_repository.get_by_username(session, username)
        if not user or not user.is_active or not _verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")
        roles = [user.role] if user.role else []
        access = create_jwt_token(
            subject=str(user.id),
            secret=settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
            ttl_minutes=settings.access_token_ttl_minutes,
            extra_claims={"roles": roles, "attrs": {"agency_id": str(user.agency_id)}},
        )
        refresh = create_jwt_token(
            subject=str(user.id),
            secret=settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
            ttl_minutes=settings.refresh_token_ttl_minutes,
            extra_claims={"type": "refresh"},
        )
        await user_repository.append_outbox_event(
            session,
            "auth.user.login.v1",
            {"user_id": str(user.id), "username": user.username, "agency_id": str(user.agency_id)},
        )
        AUTH_LOGIN_SUCCESS.inc()
        return TokenResponse(access_token=access, refresh_token=refresh)

    async def pending_outbox(self, session: AsyncSession) -> list[dict]:
        events = await user_repository.get_pending_outbox(session)
        return [{"id": e.id, "topic": e.topic, "payload": e.payload, "dispatched": e.dispatched} for e in events]

    async def dispatch_outbox_event(self, session: AsyncSession, event_id: int) -> dict:
        events = await user_repository.get_pending_outbox(session)
        target = next((e for e in events if e.id == event_id), None)
        if not target:
            raise ValueError("Pending outbox event not found")
        await publisher.publish(target.topic, target.payload)
        updated = await user_repository.mark_outbox_dispatched(session, event_id)
        if not updated:
            raise ValueError("Outbox event not found")
        AUTH_OUTBOX_DISPATCHED.inc()
        return {"id": updated.id, "topic": updated.topic, "dispatched": updated.dispatched}


auth_service = AuthDomainService()
