"use client";

import type { HeatmapPoint } from "@/lib/api/services/map";

/** Canvas heatmap overlay placeholder when Google visualization library is unavailable. */
export function HeatmapLayer({
  points,
  width,
  height,
  bounds,
}: {
  points: HeatmapPoint[];
  width: number;
  height: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}) {
  if (!points.length || width < 1 || height < 1) return null;

  const latSpan = bounds.maxLat - bounds.minLat || 0.01;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.01;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox={`0 0 ${width} ${height}`}
    >
      {points.map((p, i) => {
        const x = ((p.lng - bounds.minLng) / lngSpan) * width;
        const y = height - ((p.lat - bounds.minLat) / latSpan) * height;
        const r = 8 + p.weight * 4;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="rgba(220, 38, 38, 0.35)"
          />
        );
      })}
    </svg>
  );
}
