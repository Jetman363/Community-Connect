import type { GeofenceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withinRadiusM } from "@/lib/geo/distance";
import { parsePolygonRing, pointInPolygon } from "@/lib/geo/polygon";
import type { GeofenceDto, WatchAreaDto } from "@/types/safety";

export function mapGeofence(z: {
  id: string;
  communityId: string;
  name: string;
  type: GeofenceType;
  centerLat: number | null;
  centerLng: number | null;
  radiusM: number | null;
  polygon: unknown;
  active: boolean;
}): GeofenceDto {
  return {
    id: z.id,
    communityId: z.communityId,
    name: z.name,
    type: z.type,
    centerLat: z.centerLat,
    centerLng: z.centerLng,
    radiusM: z.radiusM,
    polygon: z.polygon,
    active: z.active,
  };
}

export function pointInGeofence(
  lat: number,
  lng: number,
  zone: { centerLat: number | null; centerLng: number | null; radiusM: number | null; polygon: unknown }
): boolean {
  const ring = parsePolygonRing(zone.polygon);
  if (ring) return pointInPolygon(lat, lng, ring);
  if (zone.centerLat != null && zone.centerLng != null && zone.radiusM) {
    return withinRadiusM(lat, lng, zone.centerLat, zone.centerLng, zone.radiusM);
  }
  return false;
}

export async function listGeofences(communityId: string) {
  const zones = await prisma.geofenceZone.findMany({
    where: { communityId, active: true },
    orderBy: { name: "asc" },
  });
  return zones.map(mapGeofence);
}

export async function createGeofence(data: {
  communityId: string;
  name: string;
  type?: GeofenceType;
  centerLat?: number;
  centerLng?: number;
  radiusM?: number;
  polygon?: unknown;
}) {
  const { polygon, ...rest } = data;
  const z = await prisma.geofenceZone.create({
    data: {
      ...rest,
      ...(polygon !== undefined ? { polygon: polygon as Prisma.InputJsonValue } : {}),
    },
  });
  return mapGeofence(z);
}

export async function subscribeToGeofence(userId: string, zoneId: string) {
  return prisma.alertSubscription.upsert({
    where: { userId_zoneId: { userId, zoneId } },
    create: { userId, zoneId },
    update: {},
  });
}

export async function listWatchAreas(userId: string): Promise<WatchAreaDto[]> {
  const areas = await prisma.watchArea.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return areas.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    centerLat: a.centerLat,
    centerLng: a.centerLng,
    radiusM: a.radiusM,
  }));
}

export async function findGeofenceRoomsForPoint(
  communityId: string,
  lat: number,
  lng: number
): Promise<string[]> {
  const zones = await prisma.geofenceZone.findMany({
    where: { communityId, active: true },
  });
  return zones.filter((z) => pointInGeofence(lat, lng, z)).map((z) => `geofence:${z.id}`);
}
