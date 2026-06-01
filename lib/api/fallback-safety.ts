import { mockAlerts } from "@/lib/mock-data/alerts";
import type { SafetyAlertDto, IncidentReportDto, MapMarkerDto } from "@/types/safety";

const SEVERITY_MAP: Record<string, SafetyAlertDto["severity"]> = {
  INFO: "INFO",
  ADVISORY: "LOW",
  WARNING: "MODERATE",
  EMERGENCY: "CRITICAL",
};

const CATEGORY_MAP: Record<string, SafetyAlertDto["category"]> = {
  crime: "CRIME",
  weather: "WEATHER",
  traffic: "TRAFFIC",
  missing: "MISSING",
  hoa: "HOA",
  community: "COMMUNITY",
};

export function getMockSafetyAlerts(): SafetyAlertDto[] {
  return mockAlerts.map((a) => ({
    id: a.id,
    communityId: "mock-community",
    title: a.title,
    description: a.description,
    category: CATEGORY_MAP[a.category] ?? "OTHER",
    severity: SEVERITY_MAP[a.severity] ?? "INFO",
    lat: a.lat,
    lng: a.lng,
    radiusM: 500,
    locationLabel: a.location,
    active: a.active,
    source: a.source,
    createdAt: a.createdAt,
    expiresAt: null,
    acknowledged: false,
    bookmarked: false,
  }));
}

export function getMockIncidentReports(): IncidentReportDto[] {
  return [
    {
      id: "r-mock-1",
      communityId: "mock-community",
      title: "Broken streetlight",
      description: "Light out at 2nd & Maple — reported to public works.",
      category: "MAINTENANCE",
      severity: "LOW",
      suggestedCategory: "MAINTENANCE",
      status: "SUBMITTED",
      anonymous: false,
      lat: 37.772,
      lng: -122.422,
      locationLabel: "2nd & Maple",
      mediaUrls: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      reporter: { id: "demo-resident", displayName: "Alex Resident" },
    },
  ];
}

export function getMockMapMarkers(): MapMarkerDto[] {
  return [
    ...getMockSafetyAlerts()
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        id: a.id,
        type: "alert" as const,
        title: a.title,
        lat: a.lat!,
        lng: a.lng!,
        severity: a.severity,
        category: a.category,
      })),
    ...getMockIncidentReports()
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        id: r.id,
        type: "report" as const,
        title: r.title,
        lat: r.lat!,
        lng: r.lng!,
        severity: r.severity,
        category: r.category,
      })),
  ];
}
