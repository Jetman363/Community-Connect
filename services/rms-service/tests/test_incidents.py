import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.main import app


@pytest.mark.asyncio
async def test_create_and_get_incident():
    agency_id = str(uuid4())
    user_id = str(uuid4())
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            create = await client.post(
                "/v1/incidents",
                headers={"X-User-Id": user_id, "X-Agency-Id": agency_id},
                json={
                    "agency_id": agency_id,
                    "report_number": "2026-001234",
                    "incident_type": "burglary",
                    "location": "1200 Main St",
                    "status": "open",
                },
            )
            assert create.status_code == 200
            body = create.json()
            assert body["report_number"] == "2026-001234"
            assert body["incident_type"] == "burglary"
            assert body["agency_id"] == agency_id

            get = await client.get(
                f"/v1/incidents/{body['id']}",
                headers={"X-Agency-Id": agency_id},
            )
            assert get.status_code == 200
            assert get.json()["location"] == "1200 Main St"
