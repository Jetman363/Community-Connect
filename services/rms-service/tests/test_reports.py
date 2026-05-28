import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from uuid import uuid4

from app.main import app


@pytest.mark.asyncio
async def test_create_and_get_report():
    agency_id = str(uuid4())
    user_id = str(uuid4())
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            incident = await client.post(
                "/v1/incidents",
                headers={"X-User-Id": user_id, "X-Agency-Id": agency_id},
                json={"agency_id": agency_id, "incident_type": "theft", "status": "open"},
            )
            assert incident.status_code == 200
            incident_id = incident.json()["id"]

            create = await client.post(
                "/v1/reports",
                headers={
                    "X-User-Id": user_id,
                    "X-Agency-Id": agency_id,
                    "X-Roles": "officer",
                },
                json={
                    "incident_id": incident_id,
                    "narrative": "Suspect fled northbound on foot.",
                    "ai_generated": False,
                },
            )
            assert create.status_code == 200
            body = create.json()
            assert body["narrative"] == "Suspect fled northbound on foot."
            assert body["supervisor_approved"] is False

            get = await client.get(
                f"/v1/reports/{body['id']}",
                headers={"X-Agency-Id": agency_id},
            )
            assert get.status_code == 200
            assert get.json()["incident_id"] == incident_id

            approve = await client.patch(
                f"/v1/reports/{body['id']}",
                headers={"X-Agency-Id": agency_id, "X-Roles": "supervisor"},
                json={"supervisor_approved": True},
            )
            assert approve.status_code == 200
            assert approve.json()["supervisor_approved"] is True
