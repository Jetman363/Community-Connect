import { AGENCY_ID, AI_PARSER_BASE, CAD_BASE } from "./config";
import type { BoloAlert, EmergencyCall, Incident, ParseResult, Unit } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
      if (typeof detail === "object") detail = JSON.stringify(detail);
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchIncidents(status?: string): Promise<Incident[]> {
  const params = new URLSearchParams({ agency_id: AGENCY_ID });
  if (status) params.set("status", status);
  return request(`${CAD_BASE}/incidents?${params}`);
}

export async function fetchIncident(id: string): Promise<Incident> {
  return request(`${CAD_BASE}/incidents/${id}`);
}

export async function fetchUnits(): Promise<Unit[]> {
  return request(`${CAD_BASE}/units?agency_id=${AGENCY_ID}`);
}

export async function updateUnitStatus(
  unitId: string,
  status: string,
  coords?: { lat?: number; lng?: number },
  options?: { incidentId?: string; requireReport?: boolean },
) {
  return request(`${CAD_BASE}/units/${unitId}/status?actor_id=officer`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      latitude: coords?.lat,
      longitude: coords?.lng,
      incident_id: options?.incidentId,
      require_report: options?.requireReport ?? false,
    }),
  });
}

export async function assignUnit(incidentId: string, unitId: string) {
  return request(`${CAD_BASE}/incidents/${incidentId}/assign?actor_id=dispatcher`, {
    method: "POST",
    body: JSON.stringify({ unit_id: unitId, is_primary: true }),
  });
}

export async function createIncidentCase(incidentId: string, actorId: string): Promise<Incident> {
  return request(`${CAD_BASE}/incidents/${incidentId}/create-case?actor_id=${actorId}`, {
    method: "POST",
  });
}

export async function fetchCalls(): Promise<EmergencyCall[]> {
  return request(`${CAD_BASE}/calls?agency_id=${AGENCY_ID}`);
}

export async function createCall(data: Partial<EmergencyCall>): Promise<EmergencyCall> {
  return request(`${CAD_BASE}/calls`, {
    method: "POST",
    body: JSON.stringify({ agency_id: AGENCY_ID, ...data }),
  });
}

export async function fetchBolos(): Promise<BoloAlert[]> {
  return request(`${CAD_BASE}/bolos?agency_id=${AGENCY_ID}`);
}

export async function parseCallText(text: string): Promise<ParseResult> {
  return request(`${AI_PARSER_BASE}/parse`, {
    method: "POST",
    body: JSON.stringify({ text, agency_id: AGENCY_ID }),
  });
}

export async function createIncidentFromCall(data: Record<string, unknown>): Promise<Incident> {
  return request(`${CAD_BASE}/incidents?actor_id=calltaker`, {
    method: "POST",
    body: JSON.stringify({ agency_id: AGENCY_ID, ...data }),
  });
}

export async function getUnitRecommendations(incidentId: string): Promise<{ unit_id: string; call_sign: string; score: number; reason: string }[]> {
  return request(`${CAD_BASE}/incidents/${incidentId}/recommendations`);
}

export async function silentEmergency(unitId: string, officerId: string) {
  return request(`${CAD_BASE}/units/silent-emergency`, {
    method: "POST",
    body: JSON.stringify({ unit_id: unitId, officer_id: officerId }),
  });
}

export async function queryNcicVehicle(data: { plate?: string; state?: string; vin?: string }) {
  return request<import("./types").NcicQueryResult>(`${CAD_BASE}/ncic/vehicle`, {
    method: "POST",
    body: JSON.stringify({
      agency_id: AGENCY_ID,
      state: data.state ?? "TX",
      plate: data.plate,
      vin: data.vin,
    }),
  });
}

export async function queryNcicPerson(data: {
  last_name?: string;
  first_name?: string;
  dob?: string;
  dl_number?: string;
  sid?: string;
  address?: string;
}) {
  return request<import("./types").NcicQueryResult>(`${CAD_BASE}/ncic/person`, {
    method: "POST",
    body: JSON.stringify({ agency_id: AGENCY_ID, ...data }),
  });
}
