import { OFFICER_ROSTER, SERVICE_AREAS, type OfficerProfile, type ServiceArea } from "./officer-roster";
import type { UserRole } from "./types";

export interface ProgramUserProfile {
  id: string;
  name: string;
  badge: string;
  role: UserRole;
  defaultServiceArea: ServiceArea;
  password: string;
  primaryUnit?: string;
  allowedUnits?: string[];
  /** Field supervisor permission — granted when supervisor account is provisioned */
  supervisorMode?: boolean;
}

export const CALLTAKER_ROSTER: ProgramUserProfile[] = [
  {
    id: "ct-001",
    name: "Calltaker Williams",
    badge: "7050",
    role: "calltaker",
    defaultServiceArea: "Central",
    password: "williams7050",
  },
  {
    id: "ct-002",
    name: "Calltaker Nguyen",
    badge: "7051",
    role: "calltaker",
    defaultServiceArea: "North",
    password: "nguyen7051",
  },
  {
    id: "ct-003",
    name: "Calltaker Brooks",
    badge: "7052",
    role: "calltaker",
    defaultServiceArea: "Information channel",
    password: "brooks7052",
  },
];

export const DISPATCHER_ROSTER: ProgramUserProfile[] = [
  {
    id: "disp-001",
    name: "Dispatcher Jones",
    badge: "7100",
    role: "dispatcher",
    defaultServiceArea: "Central",
    password: "jones7100",
  },
  {
    id: "disp-002",
    name: "Dispatcher Lee",
    badge: "7101",
    role: "dispatcher",
    defaultServiceArea: "South",
    password: "lee7101",
  },
  {
    id: "disp-003",
    name: "Dispatcher Patel",
    badge: "7102",
    role: "dispatcher",
    defaultServiceArea: "Information channel",
    password: "patel7102",
  },
];

export const SUPERVISOR_ROSTER: ProgramUserProfile[] = [
  {
    id: "sup-001",
    name: "Sgt. Martinez",
    badge: "7200",
    role: "supervisor",
    defaultServiceArea: "Central",
    password: "martinez7200",
    supervisorMode: true,
    primaryUnit: "SUP-1",
    allowedUnits: ["SUP-1"],
  },
  {
    id: "sup-002",
    name: "Lt. Thompson",
    badge: "7201",
    role: "supervisor",
    defaultServiceArea: "North",
    password: "thompson7201",
    supervisorMode: true,
    primaryUnit: "SUP-2",
    allowedUnits: ["SUP-2"],
  },
  {
    id: "sup-003",
    name: "Capt. Rivera",
    badge: "7202",
    role: "supervisor",
    defaultServiceArea: "EAGLE",
    password: "rivera7202",
    supervisorMode: true,
    primaryUnit: "SUP-3",
    allowedUnits: ["SUP-3"],
  },
];

export const ADMIN_ROSTER: ProgramUserProfile[] = [
  {
    id: "adm-001",
    name: "Admin User",
    badge: "7300",
    role: "admin",
    defaultServiceArea: "Central",
    password: "admin7300",
  },
  {
    id: "adm-002",
    name: "Demo Administrator",
    badge: "7301",
    role: "admin",
    defaultServiceArea: "Information channel",
    password: "demo7301",
  },
];

function officerToProgramProfile(officer: OfficerProfile): ProgramUserProfile {
  return {
    id: officer.id,
    name: officer.name,
    badge: officer.badge,
    role: "officer",
    defaultServiceArea: officer.defaultServiceArea,
    password: officer.password,
    primaryUnit: officer.primaryUnit,
    allowedUnits: officer.allowedUnits,
    supervisorMode: officer.supervisorMode,
  };
}

export const OFFICER_PROGRAM_ROSTER: ProgramUserProfile[] = OFFICER_ROSTER.map(officerToProgramProfile);

const ROSTERS: Partial<Record<UserRole, ProgramUserProfile[]>> = {
  officer: OFFICER_PROGRAM_ROSTER,
  calltaker: CALLTAKER_ROSTER,
  dispatcher: DISPATCHER_ROSTER,
  supervisor: SUPERVISOR_ROSTER,
  admin: ADMIN_ROSTER,
};

export function getRosterForRole(role: UserRole): ProgramUserProfile[] {
  return ROSTERS[role] ?? [];
}

export function getProgramUser(role: UserRole, userId: string): ProgramUserProfile | undefined {
  return getRosterForRole(role).find((u) => u.id === userId);
}

export function roleRequiresServiceArea(role: UserRole): boolean {
  return role !== "calltaker";
}

export interface ProgramLoginInput {
  role: UserRole;
  userId: string;
  serviceArea?: ServiceArea;
  password: string;
  unitCallSign?: string;
}

export function validateProgramLogin(input: ProgramLoginInput): {
  ok: true;
  profile: ProgramUserProfile;
} | {
  ok: false;
  error: string;
} {
  const profile = getProgramUser(input.role, input.userId);
  if (!profile) return { ok: false, error: "Select a user" };

  if (roleRequiresServiceArea(input.role)) {
    if (!input.serviceArea || !SERVICE_AREAS.includes(input.serviceArea)) {
      return { ok: false, error: "Select a valid service area" };
    }
  }
  if (!input.password) return { ok: false, error: "Enter your password" };
  if (input.password !== profile.password) {
    return { ok: false, error: "Invalid password" };
  }

  if (input.role === "officer") {
    if (!input.unitCallSign) return { ok: false, error: "Select a unit number" };
    if (profile.allowedUnits && !profile.allowedUnits.includes(input.unitCallSign)) {
      return { ok: false, error: `${profile.name} is not authorized for unit ${input.unitCallSign}` };
    }
  }

  return { ok: true, profile };
}
