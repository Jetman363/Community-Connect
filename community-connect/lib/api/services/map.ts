import type { AlertCategory, AlertSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bboxFromCenter, withinRadiusM } from "@/lib/geo/distance";
import type { MapMarkerDto } from "@/types/safety";

export type MapLayer = "alerts" | "reports" | "events" | "businesses" | "all";

export interface MapMarkersInput {
  communityId: string;
  layers?: MapLayer[];
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  lat?: number;
  lng?: number;
  radiusM?: number;
}

function inBbox(
  lat: number,
  lng: number,
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  if (!bbox) return true;
  return lat >= bbox.minLat && lat <= bbox.maxLat && lng >= bbox.minLng && lng <= bbox.maxLng;
}

export async function getMapMarkers(input: MapMarkersInput): Promise<MapMarkerDto[]> {
  const layers = input.layers ?? ["alerts", "events", "businesses"];
  const bbox =
    input.minLat != null && input.maxLat != null && input.minLng != null && input.maxLng != null
      ? { minLat: input.minLat, maxLat: input.maxLat, minLng: input.minLng, maxLng: input.maxLng }
      : input.lat != null && input.lng != null && input.radiusM
        ? bboxFromCenter(input.lat, input.lng, input.radiusM)
        : undefined;

  const markers: MapMarkerDto[] = [];

  if (layers.includes("all") || layers.includes("alerts")) {
    const alerts = await prisma.safetyAlert.findMany({
      where: {
        communityId: input.communityId,
        active: true,
        lat: { not: null },
        lng: { not: null },
        ...(bbox
          ? {
              lat: { gte: bbox.minLat, lte: bbox.maxLat },
              lng: { gte: bbox.minLng, lte: bbox.maxLng },
            }
          : {}),
      },
      take: 200,
    });
    for (const a of alerts) {
      if (a.lat == null || a.lng == null) continue;
      if (!inBbox(a.lat, a.lng, bbox)) continue;
      if (input.lat != null && input.lng != null && input.radiusM) {
        if (!withinRadiusM(input.lat, input.lng, a.lat, a.lng, input.radiusM)) continue;
      }
      markers.push({
        id: a.id,
        type: "alert",
        title: a.title,
        lat: a.lat,
        lng: a.lng,
        severity: a.severity,
        category: a.category,
        meta: { active: a.active, source: a.source },
      });
    }
  }

  if (layers.includes("all") || layers.includes("reports")) {
    const reports = await prisma.report.findMany({
      where: {
        communityId: input.communityId,
        lat: { not: null },
        lng: { not: null },
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] },
        ...(bbox
          ? {
              lat: { gte: bbox.minLat, lte: bbox.maxLat },
              lng: { gte: bbox.minLng, lte: bbox.maxLng },
            }
          : {}),
      },
      take: 100,
    });
    for (const r of reports) {
      if (r.lat == null || r.lng == null) continue;
      markers.push({
        id: r.id,
        type: "report",
        title: r.title,
        lat: r.lat,
        lng: r.lng,
        severity: r.severity,
        category: r.category,
        meta: { status: r.status, anonymous: r.anonymous },
      });
    }
  }

  if (layers.includes("all") || layers.includes("events")) {
    const events = await prisma.event.findMany({
      where: {
        communityId: input.communityId,
        lat: { not: null },
        lng: { not: null },
        startsAt: { gte: new Date() },
        ...(bbox
          ? {
              lat: { gte: bbox.minLat, lte: bbox.maxLat },
              lng: { gte: bbox.minLng, lte: bbox.maxLng },
            }
          : {}),
      },
      take: 50,
    });
    for (const e of events) {
      if (e.lat == null || e.lng == null) continue;
      markers.push({
        id: e.id,
        type: "event",
        title: e.title,
        lat: e.lat,
        lng: e.lng,
        meta: { startsAt: e.startsAt.toISOString(), location: e.location },
      });
    }
  }

  if (layers.includes("all") || layers.includes("businesses")) {
    const businesses = await prisma.business.findMany({
      where: {
        communityId: input.communityId,
        lat: { not: null },
        lng: { not: null },
        ...(bbox
          ? {
              lat: { gte: bbox.minLat, lte: bbox.maxLat },
              lng: { gte: bbox.minLng, lte: bbox.maxLng },
            }
          : {}),
      },
      take: 80,
    });
    for (const b of businesses) {
      if (b.lat == null || b.lng == null) continue;
      markers.push({
        id: b.id,
        type: "business",
        title: b.name,
        lat: b.lat,
        lng: b.lng,
        category: b.category,
        meta: { verified: b.verified, rating: b.rating },
      });
    }
  }

  return markers;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  type: string;
}

export async function getHeatmapData(input: {
  communityId: string;
  since?: Date;
  category?: AlertCategory;
  severity?: AlertSeverity;
}): Promise<HeatmapPoint[]> {
  const since = input.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [alerts, reports] = await Promise.all([
    prisma.safetyAlert.findMany({
      where: {
        communityId: input.communityId,
        createdAt: { gte: since },
        lat: { not: null },
        lng: { not: null },
        ...(input.category ? { category: input.category } : {}),
        ...(input.severity ? { severity: input.severity } : {}),
      },
      select: { lat: true, lng: true, severity: true },
    }),
    prisma.report.findMany({
      where: {
        communityId: input.communityId,
        createdAt: { gte: since },
        lat: { not: null },
        lng: { not: null },
      },
      select: { lat: true, lng: true, severity: true },
    }),
  ]);

  const weightFor = (s: string) =>
    ({ CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1, INFO: 0.5 } as Record<string, number>)[s] ?? 1;

  return [
    ...alerts.map((a) => ({
      lat: a.lat!,
      lng: a.lng!,
      weight: weightFor(a.severity),
      type: "alert",
    })),
    ...reports.map((r) => ({
      lat: r.lat!,
      lng: r.lng!,
      weight: weightFor(r.severity),
      type: "report",
    })),
  ];
}

export async function getNearby(
  communityId: string,
  lat: number,
  lng: number,
  radiusM: number,
  type: "alerts" | "events" | "services"
) {
  if (type === "alerts") {
    const alerts = await prisma.safetyAlert.findMany({
      where: { communityId, active: true, lat: { not: null }, lng: { not: null } },
      take: 100,
    });
    return alerts.filter(
      (a) => a.lat != null && a.lng != null && withinRadiusM(lat, lng, a.lat, a.lng, radiusM)
    );
  }
  if (type === "events") {
    const events = await prisma.event.findMany({
      where: { communityId, startsAt: { gte: new Date() }, lat: { not: null }, lng: { not: null } },
      take: 50,
    });
    return events.filter(
      (e) => e.lat != null && e.lng != null && withinRadiusM(lat, lng, e.lat, e.lng, radiusM)
    );
  }
  const businesses = await prisma.business.findMany({
    where: { communityId, lat: { not: null }, lng: { not: null } },
    take: 80,
  });
  return businesses.filter(
    (b) => b.lat != null && b.lng != null && withinRadiusM(lat, lng, b.lat, b.lng, radiusM)
  );
}
