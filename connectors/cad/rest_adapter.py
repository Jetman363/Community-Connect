"""
Example REST adapter for external CAD system integration.

Polls external CAD API for unit AVL updates and syncs to BlueCore cad-dispatch-service.
Configure via integration-service connector registry.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class ExternalCadRestAdapter:
    """Poll-based REST connector for legacy CAD systems."""

    def __init__(
        self,
        external_cad_url: str,
        api_key: str,
        bluecore_cad_url: str = "http://cad-dispatch-service:8070",
        agency_id: str = "agency-demo-001",
        poll_interval_seconds: int = 5,
    ) -> None:
        self.external_cad_url = external_cad_url.rstrip("/")
        self.api_key = api_key
        self.bluecore_cad_url = bluecore_cad_url
        self.agency_id = agency_id
        self.poll_interval_seconds = poll_interval_seconds

    async def fetch_external_units(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{self.external_cad_url}/api/v1/units",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            return response.json().get("units", [])

    async def sync_unit_to_bluecore(self, external_unit: dict[str, Any]) -> None:
        payload = {
            "status": self._map_status(external_unit.get("status", "available")),
            "latitude": external_unit.get("lat"),
            "longitude": external_unit.get("lng"),
            "heading": external_unit.get("heading"),
            "speed_mph": external_unit.get("speed"),
        }
        unit_id = external_unit.get("bluecore_unit_id")
        if not unit_id:
            logger.warning("No BlueCore unit mapping for %s", external_unit.get("call_sign"))
            return
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                f"{self.bluecore_cad_url}/v1/units/{unit_id}/status",
                json=payload,
                params={"actor_id": "cad-connector"},
            )

    async def poll_loop(self) -> None:
        while True:
            try:
                units = await self.fetch_external_units()
                for unit in units:
                    await self.sync_unit_to_bluecore(unit)
            except Exception:  # noqa: BLE001
                logger.exception("CAD REST sync failed")
            await asyncio.sleep(self.poll_interval_seconds)

    @staticmethod
    def _map_status(external_status: str) -> str:
        mapping = {
            "AVL": "available",
            "ENR": "en_route",
            "ONS": "on_scene",
            "TRN": "transporting",
            "CLR": "clear",
            "OOS": "out_of_service",
            "EMG": "emergency",
        }
        return mapping.get(external_status.upper(), external_status.lower())


async def main() -> None:
    adapter = ExternalCadRestAdapter(
        external_cad_url="https://cad.example.gov",
        api_key="your-api-key",
    )
    await adapter.poll_loop()


if __name__ == "__main__":
    asyncio.run(main())
