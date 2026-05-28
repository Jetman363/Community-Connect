export type AdminRole = "superadmin" | "admin" | "supervisor" | "analyst" | "viewer";

export const ADMIN_ROLES: AdminRole[] = ["superadmin", "admin", "supervisor", "analyst", "viewer"];

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  supervisor: "Supervisor",
  analyst: "Analyst",
  viewer: "Viewer",
};

const ADMIN_ACCESS_ROLES = new Set([
  "superadmin",
  "admin",
  "supervisor",
  "administrator",
  "agency_admin",
  "integration_manager",
]);

export function decodeTokenRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.roles as string[]) ?? [];
  } catch {
    return [];
  }
}

export function hasAdminAccess(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ACCESS_ROLES.has(r.toLowerCase()));
}

export function canManageUsers(roles: string[]): boolean {
  return roles.some((r) => ["superadmin", "admin", "administrator"].includes(r.toLowerCase()));
}

export function canManageConnectors(roles: string[]): boolean {
  return roles.some((r) => ["superadmin", "admin", "administrator", "integration_manager"].includes(r.toLowerCase()));
}

export function canManageRules(roles: string[]): boolean {
  return roles.some((r) => ["superadmin", "admin", "administrator", "supervisor"].includes(r.toLowerCase()));
}
