import { haversineMeters } from "@/lib/geo/distance";
import { DEFAULT_RADIUS_MILES } from "@/config/interests";
import type { GeoLocatable } from "@/types/radius";

const MILES_TO_METERS = 1609.344;

export function milesToMeters(miles: number): number {
  return miles * MILES_TO_METERS;
}

export function metersToMiles(meters: number): number {
  return meters / MILES_TO_METERS;
}

/** Haversine distance in miles between two WGS84 points. */
export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return metersToMiles(haversineMeters(lat1, lng1, lat2, lng2));
}

export function withinRadiusMiles(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): boolean {
  return haversineMeters(lat, lng, centerLat, centerLng) <= milesToMeters(radiusMiles);
}

export interface GeoFilterOptions {
  centerLat: number;
  centerLng: number;
  radiusMiles?: number;
  sortByDistance?: boolean;
}

export interface GeoFilteredItem<T extends GeoLocatable> extends GeoLocatable {
  item: T;
  distanceMiles: number;
}

/** Filter items with lat/lng within radius; items without coords pass through at end. */
export function filterByRadius<T extends GeoLocatable>(
  items: T[],
  options: GeoFilterOptions
): GeoFilteredItem<T>[] {
  const radiusMiles = options.radiusMiles ?? DEFAULT_RADIUS_MILES;
  const withCoords: GeoFilteredItem<T>[] = [];
  const withoutCoords: GeoFilteredItem<T>[] = [];

  for (const item of items) {
    if (item.lat == null || item.lng == null) {
      withoutCoords.push({ item, distanceMiles: Infinity, lat: item.lat, lng: item.lng });
      continue;
    }
    const distanceMiles = haversineMiles(
      options.centerLat,
      options.centerLng,
      item.lat,
      item.lng
    );
    if (distanceMiles <= radiusMiles) {
      withCoords.push({ item, distanceMiles, lat: item.lat, lng: item.lng });
    }
  }

  if (options.sortByDistance !== false) {
    withCoords.sort((a, b) => a.distanceMiles - b.distanceMiles);
  }

  return [...withCoords, ...withoutCoords];
}

/** Map entity type to interest keywords for scoring boost */
export const ENTITY_INTEREST_MAP: Record<string, string[]> = {
  marketplace: ["marketplace", "business"],
  listing: ["marketplace"],
  event: ["events", "family", "sports"],
  deal: ["deals", "restaurants"],
  business: ["restaurants", "business", "deals"],
  alert: ["safety"],
  news: ["news", "community"],
  group: ["community", "family", "sports", "pets"],
  post: ["community"],
};

export function interestBoost(entityType: string, interests: string[]): number {
  const keys = ENTITY_INTEREST_MAP[entityType.toLowerCase()] ?? [];
  let boost = 0;
  for (const key of keys) {
    if (interests.includes(key)) boost += 10;
  }
  return boost;
}
