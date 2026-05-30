import type { UserRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  RESIDENT: 1,
  VERIFIED_USER: 2,
  BUSINESS_OWNER: 3,
  HOA_MANAGER: 4,
  COMMUNITY_MODERATOR: 5,
  MODERATOR: 6,
  PUBLIC_SAFETY: 7,
  DISPATCHER: 8,
  SUPERVISOR: 9,
  ENTERPRISE_CLIENT: 10,
  ADMIN: 11,
  SUPER_ADMIN: 12,
};

/** SUPER_ADMIN bypasses community-scoped permission checks. */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  if (isSuperAdmin(userRole)) return true;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canModerate(role: UserRole): boolean {
  return hasMinRole(role, "MODERATOR") || role === "COMMUNITY_MODERATOR";
}

export function canAdmin(role: UserRole): boolean {
  return hasMinRole(role, "ADMIN") || role === "ENTERPRISE_CLIENT";
}

export function canManageHOA(role: UserRole): boolean {
  return role === "HOA_MANAGER" || canAdmin(role) || isSuperAdmin(role);
}

export function canPublishSafetyAlert(role: UserRole): boolean {
  return (
    role === "PUBLIC_SAFETY" ||
    role === "DISPATCHER" ||
    role === "SUPERVISOR" ||
    canModerate(role)
  );
}

export function canDispatch(role: UserRole): boolean {
  return role === "DISPATCHER" || role === "SUPERVISOR" || role === "PUBLIC_SAFETY" || canAdmin(role);
}

export function canManageBusiness(role: UserRole): boolean {
  return role === "BUSINESS_OWNER" || canModerate(role);
}

export function canEnterpriseAdmin(role: UserRole): boolean {
  return canAdmin(role) || role === "ENTERPRISE_CLIENT" || isSuperAdmin(role);
}
