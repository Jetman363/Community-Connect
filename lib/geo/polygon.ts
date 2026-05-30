/** Ray-casting point-in-polygon for simple GeoJSON-style rings [[lng, lat], ...]. */
export function pointInPolygon(
  lat: number,
  lng: number,
  ring: [number, number][]
): boolean {
  if (ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Parse stored polygon JSON to a ring of [lng, lat]. */
export function parsePolygonRing(polygon: unknown): [number, number][] | null {
  if (!polygon || typeof polygon !== "object") return null;
  const geo = polygon as { type?: string; coordinates?: [number, number][][] };
  if (geo.type === "Polygon" && Array.isArray(geo.coordinates?.[0])) {
    return geo.coordinates[0].map(([lng, lat]) => [lng, lat] as [number, number]);
  }
  if (Array.isArray(polygon) && Array.isArray(polygon[0])) {
    return polygon as [number, number][];
  }
  return null;
}
