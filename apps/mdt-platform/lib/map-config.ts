export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

/** Default center: San Antonio, TX (demo incident area) */
export const DEFAULT_MAP_CENTER: [number, number] = [-98.4936, 29.4241];

export const DEFAULT_MAP_ZOOM = 11;

export const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

export const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
