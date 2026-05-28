"""Rate limiting middleware for admin routes."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware


class AdminRateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding window rate limiter for /v1/admin paths."""

    def __init__(self, app, max_requests: int = 120, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/v1/admin"):
            return await call_next(request)

        client = request.headers.get("x-user-id") or (request.client.host if request.client else "unknown")
        now = time.time()
        window = self._hits[client]
        while window and now - window[0] > self.window_seconds:
            window.popleft()
        if len(window) >= self.max_requests:
            raise HTTPException(status_code=429, detail="Admin rate limit exceeded")
        window.append(now)
        return await call_next(request)
