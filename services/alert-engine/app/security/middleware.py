import time
from collections import defaultdict

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.settings import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int | None = None) -> None:
        super().__init__(app)
        self._limit = limit_per_minute or settings.rate_limit_per_minute
        self._buckets: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/healthz", "/readyz", "/metrics"):
            return await call_next(request)
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        now = time.time()
        window_start = now - 60
        self._buckets[key] = [t for t in self._buckets[key] if t >= window_start]
        if len(self._buckets[key]) >= self._limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        self._buckets[key].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self._limit)
        return response
