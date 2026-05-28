from datetime import datetime, timezone
from hashlib import sha256
from pydantic import BaseModel


class AuditEvent(BaseModel):
    event_type: str
    actor_id: str | None = None
    resource_type: str
    resource_id: str
    action: str
    outcome: str
    metadata: dict = {}
    created_at: str = datetime.now(timezone.utc).isoformat()
    prev_hash: str | None = None

    def immutable_hash(self) -> str:
        payload = f"{self.event_type}|{self.actor_id}|{self.resource_type}|{self.resource_id}|{self.action}|{self.outcome}|{self.created_at}|{self.prev_hash}|{self.metadata}"
        return sha256(payload.encode("utf-8")).hexdigest()
