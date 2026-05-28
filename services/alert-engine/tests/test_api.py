import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.settings import settings


@pytest.fixture
def app():
    settings.run_alembic_on_startup = False
    settings.consumer_worker_enabled = False
    settings.poll_worker_enabled = False
    settings.event_backend = "redis"
    return create_app()


@pytest.mark.asyncio
async def test_healthz(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        assert resp.json()["service"] == "alert-engine"
