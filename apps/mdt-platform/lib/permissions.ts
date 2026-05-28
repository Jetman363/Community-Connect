import type { UserRole } from "./types";

/** Officers only — dispatchers and supervisors cannot access incident reports. */
export function canAccessReports(role: UserRole): boolean {
  return role === "officer";
}

/** Dispatchers manage unit status for all personnel; supervisors monitor only. */
export function canManageUnitStatus(role: UserRole): boolean {
  return role === "dispatcher";
}

export function canAssignIncidents(role: UserRole): boolean {
  return role === "dispatcher";
}

/** Unit types dispatch may assign to officers (excludes EMS/fire unless specialty). */
export const OFFICER_ASSIGNABLE_UNIT_TYPES = ["patrol", "k9", "supervisor"] as const;

export function isOfficerAssignableUnit(unitType: string): boolean {
  return (OFFICER_ASSIGNABLE_UNIT_TYPES as readonly string[]).includes(unitType);
}

export function isSupervisorUnit(unitType: string): boolean {
  return unitType === "supervisor";
}
