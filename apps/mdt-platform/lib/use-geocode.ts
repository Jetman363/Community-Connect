"use client";

import { useEffect, useState } from "react";
import { MAPBOX_GEOCODE_URL, MAPBOX_TOKEN } from "./map-config";

export interface GeocodeResult {
  lat: number;
  lng: number;
  placeName: string;
}

export function useGeocode(query: string, debounceMs = 600): GeocodeResult | null {
  const [result, setResult] = useState<GeocodeResult | null>(null);

  useEffect(() => {
    if (!query.trim() || !MAPBOX_TOKEN) {
      setResult(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query.trim());
        const url = `${MAPBOX_GEOCODE_URL}/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=US`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature?.center) return;
        const [lng, lat] = feature.center as [number, number];
        setResult({ lat, lng, placeName: feature.place_name ?? query });
      } catch {
        setResult(null);
      }
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [query, debounceMs]);

  return result;
}
