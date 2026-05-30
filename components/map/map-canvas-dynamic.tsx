"use client";

import dynamic from "next/dynamic";
import type { MapMarkerDto } from "@/types/safety";

const MapCanvas = dynamic(
  () => import("./map-canvas").then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[50vh] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
        Loading map…
      </div>
    ),
  }
);

export function MapCanvasDynamic(props: {
  markers: MapMarkerDto[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarkerDto) => void;
  className?: string;
}) {
  return <MapCanvas {...props} />;
}
