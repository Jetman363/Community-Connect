import type { AlertCategory, AlertSeverity } from "@prisma/client";
import type { CadIncident } from "./cad-connector.interface";

const CATEGORY_MAP: Record<string, AlertCategory> = {
  fire: "FIRE",
  medical: "MEDICAL",
  crime: "CRIME",
  traffic: "TRAFFIC",
  weather: "WEATHER",
  missing: "MISSING",
};

const SEVERITY_MAP: Record<string, AlertSeverity> = {
  info: "INFO",
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  critical: "CRITICAL",
};

export interface NormalizedSafetyAlert {
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  source: string;
  externalId: string;
}

export function normalizeCadIncident(incident: CadIncident, source: string): NormalizedSafetyAlert {
  const catKey = incident.category.toLowerCase();
  const sevKey = incident.severity.toLowerCase();
  return {
    title: incident.title,
    description: incident.description,
    category: CATEGORY_MAP[catKey] ?? "OTHER",
    severity: SEVERITY_MAP[sevKey] ?? "MODERATE",
    lat: incident.lat,
    lng: incident.lng,
    locationLabel: incident.locationLabel,
    source,
    externalId: incident.externalId,
  };
}

export function normalizeCadWebhook(raw: Record<string, unknown>): CadIncident {
  return {
    externalId: String(raw.incidentId ?? raw.id ?? crypto.randomUUID()),
    title: String(raw.title ?? raw.callType ?? "CAD Incident"),
    description: String(raw.description ?? raw.notes ?? ""),
    category: String(raw.category ?? raw.callType ?? "other"),
    severity: String(raw.priority ?? raw.severity ?? "moderate"),
    lat: typeof raw.lat === "number" ? raw.lat : undefined,
    lng: typeof raw.lng === "number" ? raw.lng : undefined,
    locationLabel: raw.location != null ? String(raw.location) : undefined,
    status: String(raw.status ?? "active"),
  };
}
