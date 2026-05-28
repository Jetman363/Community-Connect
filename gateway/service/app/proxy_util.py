from typing import Any

import httpx
from fastapi import HTTPException, Response


async def forward_request(
    method: str,
    url: str,
    *,
    authorization: str = "",
    json_body: dict | None = None,
    params: dict | None = None,
    timeout: float = 15.0,
) -> Any:
    headers: dict[str, str] = {}
    if authorization:
        headers["Authorization"] = authorization
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.request(method, url, headers=headers, json=json_body, params=params)
    if response.status_code >= 400:
        detail: Any
        try:
            detail = response.json()
        except Exception:  # noqa: BLE001
            detail = response.text
        raise HTTPException(status_code=response.status_code, detail=detail)
    if not response.content:
        return {}
    try:
        return response.json()
    except Exception:  # noqa: BLE001
        return {"raw": response.text}


async def forward_stream(method: str, url: str, *, authorization: str = "", timeout: float = 30.0) -> Response:
    headers: dict[str, str] = {}
    if authorization:
        headers["Authorization"] = authorization
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.request(method, url, headers=headers)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return Response(content=response.content, media_type=response.headers.get("content-type", "text/event-stream"))
