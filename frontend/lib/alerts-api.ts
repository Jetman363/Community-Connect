import { apiRequest } from "@/lib/api-client";
import type { Priority } from "@/types";

export interface BackendAlert {
  id: string;
  agency_id: string;
  source_system: string;
  event_type: string;
  severity: string;
  threat_level: string;
  title: string;
  summary: string | null;
  correlation_id: string | null;
  officer_safety: boolean;
  geolocation: { lat?: number; lon?: number } | null;
  entities: Array<Record<string, unknown>>;
  normalized_payload: Record<string, unknown>;
  ai_enrichment: Record<string, unknown>;
  threat_score: number;
  status: string;
  escalated: boolean;
  created_at: string;
}

export function threatToPriority(threatLevel: string): Priority {
  const level = threatLevel.toLowerCase();
  if (level === "critical") return "critical";
  if (level === "high") return "high";
  if (level === "medium") return "medium";
  return "low";
}

export function mapBackendAlert(alert: BackendAlert) {
  return {
    id: alert.id,
    type: alert.event_type.replace(/\./g, " ").replace(/_/g, " "),
    message: alert.summary || alert.title,
    priority: threatToPriority(alert.threat_level),
    timestamp: alert.created_at,
    sourceSystem: alert.source_system,
    officerSafety: alert.officer_safety,
    threatScore: alert.threat_score,
    threatLevel: alert.threat_level,
    status: alert.status,
    escalated: alert.escalated,
    geolocation: alert.geolocation,
    entities: alert.entities ?? [],
    correlationId: alert.correlation_id,
    aiEnrichment: alert.ai_enrichment ?? {},
    normalizedPayload: alert.normalized_payload ?? {},
    raw: alert,
  };
}

export type LiveAlert = ReturnType<typeof mapBackendAlert>;

export async function fetchAlerts(token: string, limit = 50): Promise<LiveAlert[]> {
  const data = await apiRequest<BackendAlert[]>(`/v1/alerts?limit=${limit}`, { token });
  return data.map(mapBackendAlert);
}

export async function acknowledgeAlert(
  token: string,
  alertId: string,
  action: "acknowledge" | "escalate" | "dismiss" = "acknowledge",
  notes?: string
): Promise<void> {
  await apiRequest(`/v1/alerts/${alertId}/acknowledge`, {
    method: "POST",
    token,
    body: JSON.stringify({ action, notes }),
  });
}

export async function ingestDemoAlert(token: string, agencyId: string): Promise<unknown> {
  return apiRequest("/v1/alerts/ingest/events", {
    method: "POST",
    token,
    body: JSON.stringify({
      agency_id: agencyId,
      source_system: "generic_cad",
      event_type: "cad.dispatch",
      severity: "high",
      payload: {
        summary: "Demo dispatch alert from BlueCore dashboard",
        location: "100 Main St",
        lat: 33.749,
        lng: -84.388,
      },
    }),
  });
}
