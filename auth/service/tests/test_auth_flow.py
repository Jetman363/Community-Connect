import pytest
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.main import app


@pytest.mark.asyncio
async def test_register_and_login_flow():
    agency_id = str(uuid4())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post(
            "/v1/users",
            json={
                "agency_id": agency_id,
                "username": "officer1",
                "password": "VerySecurePass123!",
                "first_name": "Alex",
                "last_name": "Smith",
                "role": "officer",
                "rank": "Detective",
            },
        )
        assert reg.status_code == 200
        body = reg.json()
        assert body["username"] == "officer1"
        assert body["agency_id"] == agency_id

        login = await client.post(
            "/v1/auth/login",
            json={"username": "officer1", "password": "VerySecurePass123!"},
        )
        assert login.status_code == 200
        assert "access_token" in login.json()
