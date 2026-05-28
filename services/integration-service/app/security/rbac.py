from fastapi import HTTPException

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "superadmin": {
        "connector:read", "connector:write", "connector:delete",
        "credential:read", "credential:write", "webhook:ingest",
        "permission:manage", "health:read", "events:read", "events:stream",
    },
    "admin": {
        "connector:read",
        "connector:write",
        "connector:delete",
        "credential:read",
        "credential:write",
        "webhook:ingest",
        "permission:manage",
        "health:read",
        "events:read",
        "events:stream",
    },
    "integration_manager": {
        "connector:read",
        "connector:write",
        "credential:read",
        "credential:write",
        "webhook:ingest",
        "health:read",
        "events:read",
        "events:stream",
    },
    "agency_admin": {
        "connector:read",
        "connector:write",
        "credential:read",
        "webhook:ingest",
        "health:read",
        "events:read",
    },
    "officer": {
        "connector:read",
        "health:read",
        "events:read",
    },
}


class RBACAuthorizer:
    def authorize(self, roles: list[str], permission: str, agency_id: str | None = None, resource_agency_id: str | None = None) -> None:
        normalized = [r.lower() for r in roles]
        if "superadmin" in normalized or "admin" in normalized or "administrator" in normalized:
            return
        allowed = set()
        for role in roles:
            allowed |= ROLE_PERMISSIONS.get(role, set())
        if permission not in allowed:
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
        if agency_id and resource_agency_id and agency_id != resource_agency_id:
            raise HTTPException(status_code=403, detail="Cross-agency access denied")


rbac = RBACAuthorizer()
