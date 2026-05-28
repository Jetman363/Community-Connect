from app.connectors.base import BaseConnector
from app.connectors.flock_safety import FlockSafetyConnector
from app.connectors.lifespot import LifeSpotConnector
from app.connectors.generic_cad import GenericCADConnector
from app.connectors.generic_osint import GenericOSINTConnector


class ConnectorRegistry:
    _connectors: dict[str, type[BaseConnector]] = {}

    @classmethod
    def register(cls, connector_cls: type[BaseConnector]) -> type[BaseConnector]:
        cls._connectors[connector_cls.connector_type] = connector_cls
        return connector_cls

    @classmethod
    def get(cls, connector_type: str) -> type[BaseConnector]:
        if connector_type not in cls._connectors:
            raise KeyError(f"Unknown connector type: {connector_type}")
        return cls._connectors[connector_type]

    @classmethod
    def list_types(cls) -> list[dict]:
        return [
            {
                "connector_type": c.connector_type,
                "display_name": c.display_name,
                "supported_auth": c.supported_auth,
                "supports_webhook": c.supports_webhook,
                "supports_polling": c.supports_polling,
            }
            for c in cls._connectors.values()
        ]

    @classmethod
    def instantiate(
        cls, connector_type: str, connector_id: str, agency_id: str, config: dict, credentials: dict
    ) -> BaseConnector:
        return cls.get(connector_type)(connector_id, agency_id, config, credentials)


# Register built-in connectors
ConnectorRegistry.register(FlockSafetyConnector)
ConnectorRegistry.register(LifeSpotConnector)
ConnectorRegistry.register(GenericCADConnector)
ConnectorRegistry.register(GenericOSINTConnector)

connector_registry = ConnectorRegistry()
