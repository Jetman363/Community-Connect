"use client";

import { useEffect, useRef, useState } from "react";
import type { MapMarkerDto } from "@/types/safety";
import { loadGoogleMaps, isMapsAvailable, DEFAULT_MAP_CENTER } from "@/lib/maps/loader";
import { markerColorForSeverity } from "@/lib/maps/markers";
import { MapFallback } from "./map-fallback";

export function MapCanvas({
  markers,
  center,
  zoom = 13,
  onMarkerClick,
  className = "h-[50vh]",
}: {
  markers: MapMarkerDto[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarkerDto) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isMapsAvailable() || !containerRef.current) return;

    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !maps || !containerRef.current) return;
        const c = center ?? DEFAULT_MAP_CENTER;
        mapRef.current = new maps.Map(containerRef.current, {
          center: c,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setReady(true);
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
    };
  }, [center?.lat, center?.lng, zoom]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const maps = google.maps;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = markers.map((m) => {
      const marker = new maps.Marker({
        map: mapRef.current!,
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        icon: m.severity
          ? {
              path: maps.SymbolPath.CIRCLE,
              fillColor: markerColorForSeverity(m.severity),
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#fff",
              scale: 10,
            }
          : undefined,
      });
      if (onMarkerClick) {
        marker.addListener("click", () => onMarkerClick(m));
      }
      return marker;
    });
  }, [markers, ready, onMarkerClick]);

  if (!isMapsAvailable() || error) {
    return <MapFallback height={className} />;
  }

  return <div ref={containerRef} className={`w-full rounded-2xl ${className}`} />;
}
