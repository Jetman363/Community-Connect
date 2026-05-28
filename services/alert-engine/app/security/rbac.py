from fastapi import HTTPException

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "superadmin": {
        "alert:read", "alert:write", "alert:acknowledge", "alert:escalate",
        "alert:stream", "alert:search", "subscription:manage", "rule:manage",
        "audit:read", "connector:read", "webhook:ingest", "health:read", "rule:read",
    },
    "administrator": {
        "alert:read",
        "alert:write",
        "alert:acknowledge",
        "alert:escalate",
        "alert:stream",
        "alert:search",
        "subscription:manage",
        "rule:manage",
        "audit:read",
        "connector:read",
        "webhook:ingest",
        "health:read",
    },
    "supervisor": {
        "alert:read",
        "alert:acknowledge",
        "alert:escalate",
        "alert:stream",
        "alert:search",
        "subscription:manage",
        "rule:read",
        "audit:read",
        "connector:read",
        "health:read",
    },
    "dispatcher": {
        "alert:read",
        "alert:acknowledge",
        "alert:stream",
        "alert:search",
        "health:read",
    },
    "detective": {
        "alert:read",
        "alert:acknowledge",
        "alert:stream",
        "alert:search",
        "health:read",
    },
    "intelligence_analyst": {
        "alert:read",
        "alert:stream",
        "alert:search",
        "audit:read",
        "health:read",
    },
    "officer": {
        "alert:read",
        "alert:acknowledge",
        "alert:stream",
        "health:read",
    },
    "admin": {
        "alert:read",
        "alert:write",
        "alert:acknowledge",
        "alert:escalate",
        "alert:stream",
        "alert:search",
        "subscription:manage",
        "rule:manage",
        "rule:read",
        "audit:read",
        "connector:read",
        "webhook:ingest",
        "health:read",
    },
    "analyst": {
        "alert:read", "alert:stream", "alert:search", "rule:read", "audit:read", "health:read",
    },
    "viewer": {
        "alert:read", "alert:stream", "rule:read", "health:read",
    },
}

THREAT_VISIBILITY: dict[str, set[str]] = {
    "officer": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "detective": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "dispatcher": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "supervisor": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "intelligence_analyst": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "administrator": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
    "admin": {"LOW", "MEDIUM", "HIGH", "CRITICAL"},
}


class RBACAuthorizer:
    def authorize(
        self,
        roles: list[str],
        permission: str,
        agency_id: str | None = None,
        resource_agency_id: str | None = None,
    ) -> None:
        if "superadmin" in roles or "administrator" in roles or "admin" in roles:
            return
        allowed: set[str] = set()
        for role in roles:
            allowed |= ROLE_PERMISSIONS.get(role, set())
        if permission not in allowed:
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
        if agency_id and resource_agency_id and agency_id != resource_agency_id:
            raise HTTPException(status_code=403, detail="Cross-agency access denied")

    def can_view_threat_level(self, roles: list[str], threat_level: str) -> bool:
        if "superadmin" in roles or "administrator" in roles or "admin" in roles:
            return True
        for role in roles:
            if threat_level in THREAT_VISIBILITY.get(role, set()):
                return True
        return False

    def can_escalate(self, roles: list[str]) -> bool:
        return bool({"supervisor", "administrator", "admin", "superadmin"} & set(roles))


rbac = RBACAuthorizer()
