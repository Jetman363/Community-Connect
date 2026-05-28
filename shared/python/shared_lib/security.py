from datetime import datetime, timedelta, timezone
import jwt


def create_jwt_token(subject: str, secret: str, algorithm: str, ttl_minutes: int, extra_claims: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl_minutes)).timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_jwt_token(token: str, secret: str, algorithms: list[str]) -> dict:
    return jwt.decode(token, secret, algorithms=algorithms)
