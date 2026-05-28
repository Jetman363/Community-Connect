class AuthorizationError(Exception):
    pass


class PolicyEngine:
    def allow(self, *, actor_roles: list[str], actor_attrs: dict, action: str, resource: str, resource_attrs: dict | None = None) -> bool:
        # Simple hybrid RBAC/ABAC baseline:
        # - Admin role bypasses checks
        # - Action permissions controlled by role map
        # - Agency scoping enforced via attributes
        if "admin" in actor_roles:
            return True

        role_map = {
            "officer": {"report:read", "report:write"},
            "detective": {"report:read", "report:write", "investigation:link"},
            "dispatcher": {"cad:read", "cad:write"},
            "supervisor": {"report:approve", "report:read", "report:write"},
        }
        allowed = set()
        for role in actor_roles:
            allowed |= role_map.get(role, set())
        if action not in allowed:
            return False

        if resource_attrs and "agency_id" in resource_attrs:
            return actor_attrs.get("agency_id") == resource_attrs.get("agency_id")
        return True


policy_engine = PolicyEngine()
