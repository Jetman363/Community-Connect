from pydantic_settings import BaseSettings, SettingsConfigDict


class GatewaySettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    gateway_host: str = "0.0.0.0"
    gateway_port: int = 8000
    auth_service_url: str = "http://auth:8001"
    rms_service_url: str = "http://rms-service:8010"
    ai_report_service_url: str = "http://ai-report-service:8020"
    alert_engine_url: str = "http://alert-engine:8060"
    integration_service_url: str = "http://integration-service:8050"
    websocket_gateway_url: str = "http://websocket-gateway:8061"
    cad_dispatch_service_url: str = "http://cad-dispatch-service:8070"
    call_parser_service_url: str = "http://call-parser-service:8080"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"


settings = GatewaySettings()
