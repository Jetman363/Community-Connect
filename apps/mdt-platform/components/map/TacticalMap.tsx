"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MAPBOX_TOKEN,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE,
} from "@/lib/map-config";
import type { MapMarker } from "@/lib/map-types";
import { boundsFromMarkers } from "@/lib/map-markers";

const KIND_COLORS: Record<MapMarker["kind"], string> = {
  incident: "#ef4444",
  unit: "#3b82f6",
  officer: "#22c55e",
  call: "#f59e0b",
};

function markerElement(m: MapMarker): HTMLDivElement {
  const el = document.createElement("div");
  const color = KIND_COLORS[m.kind];
  const size = m.selected ? 18 : 14;
  const ring = m.selected ? `0 0 0 3px ${color}55, 0 0 12px ${color}` : "none";
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "50%";
  el.style.background = color;
  el.style.border = "2px solid #fff";
  el.style.boxShadow = ring;
  el.style.cursor = "pointer";
  el.title = m.label ?? m.id;
  return el;
}

function priorityBorder(priority?: string): string {
  if (priority === "P1" || priority === "1") return "3px solid #ef4444";
  if (priority === "P2" || priority === "2") return "3px solid #f97316";
  return "2px solid #fff";
}

function incidentElement(m: MapMarker): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = m.selected ? "22px" : "18px";
  el.style.height = m.selected ? "22px" : "18px";
  el.style.borderRadius = "4px";
  el.style.background = "#dc2626";
  el.style.border = priorityBorder(m.priority);
  el.style.boxShadow = m.selected ? "0 0 12px #ef4444" : "0 2px 6px rgba(0,0,0,0.4)";
  el.style.cursor = "pointer";
  el.title = `${m.label ?? "Incident"}${m.priority ? ` · ${m.priority}` : ""}`;
  return el;
}

export interface TacticalMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  className?: string;
  fitToMarkers?: boolean;
  showNav?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

export function TacticalMap({
  markers = [],
  center,
  zoom = DEFAULT_MAP_ZOOM,
  height = "100%",
  className = "",
  fitToMarkers = false,
  showNav = true,
  onMarkerClick,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const onClickRef = useRef(onMarkerClick);
  onClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: center ?? DEFAULT_MAP_CENTER,
      zoom,
      attributionControl: false,
    });

    if (showNav) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    }
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-left");

    mapRef.current = map;

    return () => {
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !MAPBOX_TOKEN) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    for (const m of markers) {
      const el = m.kind === "incident" || m.kind === "call" ? incidentElement(m) : markerElement(m);
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map);

      if (onClickRef.current) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onClickRef.current?.(m);
        });
      }

      if (m.label) {
        marker.setPopup(
          new mapboxgl.Popup({ offset: 12, closeButton: false, maxWidth: "200px" }).setText(m.label)
        );
      }

      markerRefs.current.push(marker);
    }

    if (fitToMarkers && markers.length > 0) {
      const b = boundsFromMarkers(markers);
      if (b) {
        map.fitBounds(
          [
            [b.minLng, b.minLat],
            [b.maxLng, b.maxLat],
          ],
          { padding: 48, maxZoom: 15, duration: 600 }
        );
      }
    } else if (center) {
      map.flyTo({ center, zoom, duration: 800 });
    }
  }, [markers, center, zoom, fitToMarkers]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-900/80 border border-dashed border-slate-600 rounded text-slate-400 text-sm p-4 ${className}`}
        style={{ height, minHeight: 120 }}
      >
        <p className="font-medium text-slate-300 mb-1">Mapbox not configured</p>
        <p className="text-xs text-center max-w-xs">
          Set <code className="text-amber-400">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
          <code className="text-amber-400">.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`tactical-map rounded overflow-hidden border border-slate-700/80 ${className}`}
      style={{ height, minHeight: 120 }}
    />
  );
}
