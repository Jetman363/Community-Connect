export const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function hasMapsKey(): boolean {
  return Boolean(GOOGLE_MAPS_KEY);
}

export function staticMapUrl(lat: number, lng: number, zoom = 14): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=600x300&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
}

export function mapsEmbedUrl(lat: number, lng: number): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_KEY}&center=${lat},${lng}&zoom=14`;
}
