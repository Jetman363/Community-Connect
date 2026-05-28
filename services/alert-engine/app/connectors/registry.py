from typing import Any

from app.connectors.base import BaseAlertConnector
from app.connectors.builtins import (
    FlockSafetyAlertConnector,
    GenericCADAlertConnector,
    GenericCameraAlertConnector,
    GenericOSINTAlertConnector,
    LifeSpotAlertConnector,
    RMSAlertConnector,
)


class ConnectorRegistry:
    def __init__(self) -> None:
        self._types: dict[str, type[BaseAlertConnector]] = {}

    def register(self, cls: type[BaseAlertConnector]) -> None:
        self._types[cls.connector_type] = cls

    def instantiate(
        self, connector_type: str, agency_id: str, config: dict[str, Any], credentials: dict[str, str]
    ) -> BaseAlertConnector:
        cls = self._types.get(connector_type)
        if not cls:
            raise ValueError(f"Unknown connector type: {connector_type}")
        return cls(agency_id, config, credentials)

    def list_types(self) -> list[dict[str, Any]]:
        return [
            {
                "connector_type": cls.connector_type,
                "display_name": cls.display_name,
                "supports_webhook": cls.supports_webhook,
                "supports_polling": cls.supports_polling,
                "supports_stream": cls.supports_stream,
            }
            for cls in self._types.values()
        ]


connector_registry = ConnectorRegistry()
connector_registry.register(FlockSafetyAlertConnector)
connector_registry.register(LifeSpotAlertConnector)
connector_registry.register(GenericCADAlertConnector)
connector_registry.register(GenericOSINTAlertConnector)
connector_registry.register(RMSAlertConnector)
connector_registry.register(GenericCameraAlertConnector)
