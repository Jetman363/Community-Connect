"use client";

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let configured = false;
let mapsPromise: Promise<typeof google.maps> | null = null;

export function getGoogleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
}

export function isMapsAvailable(): boolean {
  return Boolean(getGoogleMapsApiKey());
}

export async function loadGoogleMaps(): Promise<typeof google.maps | null> {
  const key = getGoogleMapsApiKey();
  if (!key || typeof window === "undefined") return null;

  if (!configured) {
    setOptions({ key, v: "weekly" });
    configured = true;
  }

  if (!mapsPromise) {
    mapsPromise = importLibrary("maps").then(() => google.maps);
  }
  return mapsPromise;
}

export const DEFAULT_MAP_CENTER = { lat: 37.7749, lng: -122.4194 };
