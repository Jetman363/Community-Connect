# Alert Engine Connectors

Reusable connector implementations live in `services/alert-engine/app/connectors/`.

| Connector | Type | Channels |
|-----------|------|----------|
| Flock Safety | `flock_safety` | webhook, polling |
| LifeSpot | `lifespot` | webhook, polling |
| Generic CAD | `generic_cad` | webhook, polling |
| Generic OSINT | `generic_osint` | webhook, polling |
| RMS Alerts | `rms_alerts` | webhook |
| Generic Camera | `generic_camera` | webhook, stream |

Extend `BaseAlertConnector` in `base.py` and register via `connector_registry`.
