import type { Incident, Unit } from "./types";
import type { MapMarker } from "./map-types";
import { DEFAULT_MAP_CENTER } from "./map-config";

export function incidentToMarker(inc: Incident, selected = false): MapMarker | null {
  if (inc.latitude == null || inc.longitude == null) return null;
  return {
    id: inc.id,
    lat: inc.latitude,
    lng: inc.longitude,
    label: inc.incident_number,
    kind: "incident",
    priority: inc.priority,
    status: inc.status,
    selected,
  };
}

export function unitToMarker(unit: Unit, highlight = false): MapMarker | null {
  if (unit.latitude == null || unit.longitude == null) return null;
  return {
    id: unit.id,
    lat: unit.latitude,
    lng: unit.longitude,
    label: unit.call_sign,
    kind: highlight ? "officer" : "unit",
    status: unit.status,
    selected: highlight,
  };
}

export function incidentsToMarkers(incidents: Incident[], selectedId?: string): MapMarker[] {
  return incidents
    .map((inc) => incidentToMarker(inc, inc.id === selectedId))
    .filter((m): m is MapMarker => m !== null);
}

export function unitsToMarkers(units: Unit[], highlightCallSign?: string): MapMarker[] {
  return units
    .map((u) => unitToMarker(u, u.call_sign === highlightCallSign))
    .filter((m): m is MapMarker => m !== null);
}

export function mergeMapMarkers(...groups: MapMarker[][]): MapMarker[] {
  const byId = new Map<string, MapMarker>();
  for (const group of groups) {
    for (const m of group) byId.set(m.id, m);
  }
  return Array.from(byId.values());
}

export function resolveMapCenter(markers: MapMarker[]): [number, number] {
  if (!markers.length) return DEFAULT_MAP_CENTER;
  const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
  const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
  return [lng, lat];
}

export function boundsFromMarkers(markers: MapMarker[]) {
  if (!markers.length) return null;
  let minLng = markers[0].lng;
  let maxLng = markers[0].lng;
  let minLat = markers[0].lat;
  let maxLat = markers[0].lat;
  for (const m of markers) {
    minLng = Math.min(minLng, m.lng);
    maxLng = Math.max(maxLng, m.lng);
    minLat = Math.min(minLat, m.lat);
    maxLat = Math.max(maxLat, m.lat);
  }
  return { minLng, minLat, maxLng, maxLat };
}
