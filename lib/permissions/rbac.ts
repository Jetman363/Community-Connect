import type { UserRole } from "@prisma/client";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  RESIDENT: 1,
  BUSINESS_OWNER: 2,
  HOA_MANAGER: 3,
  PUBLIC_SAFETY: 4,
  MODERATOR: 5,
  ADMIN: 6,
};

export function hasMinRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canModerate(role: UserRole): boolean {
  return hasMinRole(role, "MODERATOR");
}

export function canAdmin(role: UserRole): boolean {
  return hasMinRole(role, "ADMIN");
}

export function canManageHOA(role: UserRole): boolean {
  return role === "HOA_MANAGER" || canAdmin(role);
}

export function canPublishSafetyAlert(role: UserRole): boolean {
  return role === "PUBLIC_SAFETY" || canModerate(role);
}

export function canManageBusiness(role: UserRole): boolean {
  return role === "BUSINESS_OWNER" || canModerate(role);
}
