import { ACTIVE_INCIDENTS, ALERTS, ENTITY_LINKS, INVESTIGATIONS } from "@/lib/mock-data";
import type { LiveAlert } from "@/lib/alerts-api";
import type { Priority } from "@/types";

export interface GeoMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  priority: Priority;
  kind: "alert" | "incident" | "officer_safety";
  threatScore?: number;
}

export interface IntelFeedItem {
  id: string;
  category: "correlation" | "osint" | "pattern" | "entity" | "investigation";
  title: string;
  detail: string;
  confidence?: number;
  timestamp: string;
  priority: Priority;
}

export interface CommandCenterStats {
  activeAlerts: number;
  criticalAlerts: number;
  officerSafety: number;
  avgThreatScore: number;
  geolocatedEvents: number;
  intelItems: number;
  escalated: number;
}

const MOCK_GEO: Record<string, { lat: number; lon: number }> = {
  a1: { lat: 39.7817, lon: -89.6501 },
  a2: { lat: 39.8021, lon: -89.6442 },
  a3: { lat: 39.799, lon: -89.648 },
};

export function resolveAlertGeo(alert: LiveAlert, index: number): { lat: number; lon: number } | null {
  if (alert.geolocation?.lat != null && alert.geolocation?.lon != null) {
    return { lat: alert.geolocation.lat, lon: alert.geolocation.lon };
  }
  const mock = MOCK_GEO[alert.id];
  if (mock) return mock;
  const inc = ACTIVE_INCIDENTS[index % ACTIVE_INCIDENTS.length];
  return inc ? { lat: inc.lat, lon: inc.lng } : null;
}

export function buildGeoMarkers(alerts: LiveAlert[]): GeoMarker[] {
  const markers: GeoMarker[] = alerts.map((alert, i) => {
    const geo = resolveAlertGeo(alert, i);
    if (!geo) return null;
    return {
      id: alert.id,
      lat: geo.lat,
      lon: geo.lon,
      label: alert.message.slice(0, 40),
      priority: alert.priority,
      kind: alert.officerSafety ? "officer_safety" : "alert",
      threatScore: alert.threatScore,
    };
  }).filter(Boolean) as GeoMarker[];

  for (const inc of ACTIVE_INCIDENTS.slice(0, 4)) {
    markers.push({
      id: inc.id,
      lat: inc.lat,
      lon: inc.lng,
      label: inc.callType,
      priority: inc.priority,
      kind: "incident",
    });
  }
  return markers;
}

export function buildIntelFeed(alerts: LiveAlert[]): IntelFeedItem[] {
  const items: IntelFeedItem[] = [];

  for (const alert of alerts) {
    const enrichment = alert.aiEnrichment ?? {};
    const links = (enrichment.linked_events as Array<{ type?: string; related_event_ids?: string[] }>) ?? [];
    for (const link of links) {
      items.push({
        id: `${alert.id}-${link.type}`,
        category: "correlation",
        title: `AI correlation: ${link.type ?? "link"}`,
        detail: `${(link.related_event_ids ?? []).length} related events near ${alert.type}`,
        confidence: 0.85,
        timestamp: alert.timestamp,
        priority: alert.priority,
      });
    }
    const patterns = (enrichment.patterns as string[]) ?? [];
    for (const pattern of patterns) {
      items.push({
        id: `${alert.id}-pat-${pattern}`,
        category: "pattern",
        title: `Pattern detected: ${pattern.replace(/_/g, " ")}`,
        detail: alert.message,
        confidence: 0.78,
        timestamp: alert.timestamp,
        priority: alert.priority,
      });
    }
    if (alert.sourceSystem.includes("osint") || alert.type.toLowerCase().includes("osint")) {
      items.push({
        id: `${alert.id}-osint`,
        category: "osint",
        title: "OSINT intelligence trigger",
        detail: alert.message,
        timestamp: alert.timestamp,
        priority: alert.priority,
      });
    }
  }

  if (items.length === 0) {
    for (const link of ENTITY_LINKS.slice(0, 4)) {
      items.push({
        id: link.id,
        category: "entity",
        title: `${link.source} → ${link.target}`,
        detail: link.relation.replace(/_/g, " "),
        confidence: link.confidence,
        timestamp: new Date().toISOString(),
        priority: link.confidence > 0.9 ? "high" : "medium",
      });
    }
    for (const inv of INVESTIGATIONS.slice(0, 2)) {
      items.push({
        id: inv.id,
        category: "investigation",
        title: inv.title,
        detail: inv.summary,
        timestamp: inv.lastUpdated,
        priority: inv.priority,
      });
    }
    for (const alert of ALERTS.filter((a) => a.type === "Intel")) {
      items.push({
        id: alert.id,
        category: "osint",
        title: "Fusion center intel",
        detail: alert.message,
        timestamp: alert.timestamp,
        priority: alert.priority,
      });
    }
  }

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 12);
}

export function computeStats(alerts: LiveAlert[], intelCount: number): CommandCenterStats {
  const scores = alerts.map((a) => a.threatScore).filter((s) => s > 0);
  const geoCount = alerts.filter((a, i) => resolveAlertGeo(a, i)).length;
  return {
    activeAlerts: alerts.filter((a) => a.status === "active").length || alerts.length,
    criticalAlerts: alerts.filter((a) => a.priority === "critical").length,
    officerSafety: alerts.filter((a) => a.officerSafety).length,
    avgThreatScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    geolocatedEvents: geoCount,
    intelItems: intelCount,
    escalated: alerts.filter((a) => a.escalated).length,
  };
}

export function threatScoreColor(score: number): string {
  if (score >= 85) return "text-red-400";
  if (score >= 65) return "text-amber-400";
  if (score >= 40) return "text-cyan-400";
  return "text-slate-400";
}

export function threatScoreBarColor(score: number): string {
  if (score >= 85) return "bg-red-500";
  if (score >= 65) return "bg-amber-500";
  if (score >= 40) return "bg-cyan-500";
  return "bg-slate-500";
}
