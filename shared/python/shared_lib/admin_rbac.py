"""Unified admin RBAC for law enforcement platform services."""

from __future__ import annotations

from enum import Enum


class AdminRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    ANALYST = "analyst"
    VIEWER = "viewer"


# Permission strings used across admin APIs
PERM_USER_READ = "user:read"
PERM_USER_WRITE = "user:write"
PERM_USER_DELETE = "user:delete"
PERM_PERSONNEL_READ = "personnel:read"
PERM_PERSONNEL_WRITE = "personnel:write"
PERM_CONNECTOR_READ = "connector:read"
PERM_CONNECTOR_WRITE = "connector:write"
PERM_CONNECTOR_DELETE = "connector:delete"
PERM_RULE_READ = "rule:read"
PERM_RULE_MANAGE = "rule:manage"
PERM_AUDIT_READ = "audit:read"
PERM_AUDIT_EXPORT = "audit:export"

ROLE_PERMISSIONS: dict[str, set[str]] = {
    AdminRole.SUPERADMIN.value: {
        PERM_USER_READ,
        PERM_USER_WRITE,
        PERM_USER_DELETE,
        PERM_PERSONNEL_READ,
        PERM_PERSONNEL_WRITE,
        PERM_CONNECTOR_READ,
        PERM_CONNECTOR_WRITE,
        PERM_CONNECTOR_DELETE,
        PERM_RULE_READ,
        PERM_RULE_MANAGE,
        PERM_AUDIT_READ,
        PERM_AUDIT_EXPORT,
        "credential:read",
        "credential:write",
    },
    AdminRole.ADMIN.value: {
        PERM_USER_READ,
        PERM_USER_WRITE,
        PERM_PERSONNEL_READ,
        PERM_PERSONNEL_WRITE,
        PERM_CONNECTOR_READ,
        PERM_CONNECTOR_WRITE,
        PERM_CONNECTOR_DELETE,
        PERM_RULE_READ,
        PERM_RULE_MANAGE,
        PERM_AUDIT_READ,
        PERM_AUDIT_EXPORT,
        "credential:read",
        "credential:write",
    },
    AdminRole.SUPERVISOR.value: {
        PERM_USER_READ,
        PERM_PERSONNEL_READ,
        PERM_CONNECTOR_READ,
        PERM_RULE_READ,
        PERM_RULE_MANAGE,
        PERM_AUDIT_READ,
    },
    AdminRole.ANALYST.value: {
        PERM_PERSONNEL_READ,
        PERM_CONNECTOR_READ,
        PERM_RULE_READ,
        PERM_AUDIT_READ,
    },
    AdminRole.VIEWER.value: {
        PERM_USER_READ,
        PERM_PERSONNEL_READ,
        PERM_CONNECTOR_READ,
        PERM_RULE_READ,
        PERM_AUDIT_READ,
    },
}

# Legacy role aliases
ROLE_PERMISSIONS["administrator"] = ROLE_PERMISSIONS[AdminRole.ADMIN.value]
ROLE_PERMISSIONS["integration_manager"] = ROLE_PERMISSIONS[AdminRole.ADMIN.value]
ROLE_PERMISSIONS["agency_admin"] = ROLE_PERMISSIONS[AdminRole.ADMIN.value]
ROLE_PERMISSIONS["officer"] = ROLE_PERMISSIONS[AdminRole.VIEWER.value]
ROLE_PERMISSIONS["detective"] = ROLE_PERMISSIONS[AdminRole.ANALYST.value]
ROLE_PERMISSIONS["dispatcher"] = ROLE_PERMISSIONS[AdminRole.ANALYST.value]
ROLE_PERMISSIONS["intelligence_analyst"] = ROLE_PERMISSIONS[AdminRole.ANALYST.value]


def normalize_roles(roles: list[str]) -> list[str]:
    return [r.lower().strip() for r in roles if r]


def permissions_for_roles(roles: list[str]) -> set[str]:
    perms: set[str] = set()
    for role in normalize_roles(roles):
        perms |= ROLE_PERMISSIONS.get(role, set())
    return perms


def has_permission(roles: list[str], permission: str) -> bool:
    if AdminRole.SUPERADMIN.value in normalize_roles(roles):
        return True
    return permission in permissions_for_roles(roles)


def require_permission(roles: list[str], permission: str) -> None:
    if not has_permission(roles, permission):
        raise PermissionError(f"Missing permission: {permission}")


def is_admin_role(roles: list[str]) -> bool:
    admin_roles = {
        AdminRole.SUPERADMIN.value,
        AdminRole.ADMIN.value,
        AdminRole.SUPERVISOR.value,
        "administrator",
        "agency_admin",
        "integration_manager",
    }
    return bool(admin_roles & set(normalize_roles(roles)))
