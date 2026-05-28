export const SERVICE_AREAS = [
  "North",
  "South",
  "East",
  "West",
  "Prue",
  "Central",
  "Downtown",
  "EAGLE",
  "Traffic",
  "Information channel",
] as const;

export type ServiceArea = (typeof SERVICE_AREAS)[number];

export interface OfficerProfile {
  id: string;
  name: string;
  badge: string;
  primaryUnit: string;
  allowedUnits: string[];
  defaultServiceArea: ServiceArea;
  /** Demo password — one per officer */
  password: string;
  /** Field supervisor permission (same credential as supervisor console when linked) */
  supervisorMode?: boolean;
}

/** Demo officer roster aligned with CAD seed units */
export const OFFICER_ROSTER: OfficerProfile[] = [
  {
    id: "off-001",
    name: "Officer Smith",
    badge: "4521",
    primaryUnit: "1A12",
    allowedUnits: ["1A12"],
    defaultServiceArea: "North",
    password: "smith4521",
  },
  {
    id: "off-002",
    name: "Officer Garcia",
    badge: "4533",
    primaryUnit: "2B07",
    allowedUnits: ["2B07"],
    defaultServiceArea: "South",
    password: "garcia4533",
  },
  {
    id: "off-003",
    name: "Officer Chen",
    badge: "4544",
    primaryUnit: "K9-1",
    allowedUnits: ["K9-1"],
    defaultServiceArea: "Central",
    password: "chen4544",
  },
  {
    id: "off-004",
    name: "Officer Williams",
    badge: "4555",
    primaryUnit: "1A12",
    allowedUnits: ["1A12", "2B07"],
    defaultServiceArea: "Traffic",
    password: "williams4555",
  },
  {
    id: "off-005",
    name: "Sgt. Martinez (Field Sup)",
    badge: "7200",
    primaryUnit: "SUP-1",
    allowedUnits: ["SUP-1"],
    defaultServiceArea: "Central",
    password: "martinez7200",
    supervisorMode: true,
  },
];

export const ALL_UNIT_NUMBERS = [
  ...new Set(OFFICER_ROSTER.flatMap((o) => o.allowedUnits).concat(["1A12", "2B07", "K9-1", "EMS-3", "SUP-1", "SUP-2", "SUP-3"])),
].sort();

export function getOfficerById(id: string): OfficerProfile | undefined {
  return OFFICER_ROSTER.find((o) => o.id === id);
}

export interface OfficerLoginInput {
  officerId: string;
  unitCallSign: string;
  serviceArea: ServiceArea;
  password: string;
}

export function validateOfficerLogin(input: OfficerLoginInput): {
  ok: true;
  officer: OfficerProfile;
} | {
  ok: false;
  error: string;
} {
  const officer = getOfficerById(input.officerId);
  if (!officer) return { ok: false, error: "Select an officer" };
  if (!input.unitCallSign) return { ok: false, error: "Select a unit number" };
  if (!officer.allowedUnits.includes(input.unitCallSign)) {
    return { ok: false, error: `${officer.name} is not authorized for unit ${input.unitCallSign}` };
  }
  if (!SERVICE_AREAS.includes(input.serviceArea)) {
    return { ok: false, error: "Select a valid service area" };
  }
  if (!input.password) return { ok: false, error: "Enter your password" };
  if (input.password !== officer.password) {
    return { ok: false, error: "Invalid password" };
  }
  return { ok: true, officer };
}
