"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import type { GeoMarker } from "@/lib/command-center";

interface GeospatialMapProps {
  markers: GeoMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

function projectMarkers(markers: GeoMarker[], width: number, height: number) {
  if (markers.length === 0) {
    return { projected: [] as Array<GeoMarker & { x: number; y: number }>, bounds: null };
  }
  const lats = markers.map((m) => m.lat);
  const lons = markers.map((m) => m.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padLat = (maxLat - minLat || 0.02) * 0.15;
  const padLon = (maxLon - minLon || 0.02) * 0.15;

  const projected = markers.map((m) => ({
    ...m,
    x: ((m.lon - (minLon - padLon)) / (maxLon - minLon + 2 * padLon || 1)) * (width - 40) + 20,
    y: (1 - (m.lat - (minLat - padLat)) / (maxLat - minLat + 2 * padLat || 1)) * (height - 40) + 20,
  }));

  return { projected, bounds: { minLat, maxLat, minLon, maxLon } };
}

const MARKER_COLORS = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#06b6d4",
  low: "#64748b",
};

export function GeospatialMap({ markers, selectedId, onSelect, className }: GeospatialMapProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const width = 560;
  const height = 320;

  const { projected } = useMemo(() => projectMarkers(markers, width, height), [markers]);

  return (
    <div className={cn("relative w-full h-full min-h-[320px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800", className)}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <svg viewBox={`0 0 ${width} ${height}`} className="relative w-full h-full">
        {/* district zones */}
        <ellipse cx={width * 0.35} cy={height * 0.4} rx={80} ry={55} fill="rgba(6,182,212,0.04)" stroke="rgba(6,182,212,0.15)" strokeWidth={1} />
        <ellipse cx={width * 0.65} cy={height * 0.55} rx={70} ry={45} fill="rgba(239,68,68,0.04)" stroke="rgba(239,68,68,0.12)" strokeWidth={1} />

        {projected.map((m) => {
          const isSelected = selectedId === m.id;
          const isHover = hoverId === m.id;
          const color = MARKER_COLORS[m.priority] ?? MARKER_COLORS.low;
          const radius = m.kind === "officer_safety" ? 9 : m.kind === "incident" ? 7 : 6;
          return (
            <g
              key={m.id}
              className="cursor-pointer"
              onClick={() => onSelect?.(m.id)}
              onMouseEnter={() => setHoverId(m.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              {m.kind === "officer_safety" && (
                <circle cx={m.x} cy={m.y} r={radius + 6} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.5}>
                  <animate attributeName="r" values={`${radius + 4};${radius + 10};${radius + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={m.x}
                cy={m.y}
                r={isSelected || isHover ? radius + 2 : radius}
                fill={color}
                opacity={isSelected ? 1 : 0.85}
                stroke={isSelected ? "#fff" : "rgba(15,23,42,0.8)"}
                strokeWidth={isSelected ? 2 : 1}
              />
              {(isHover || isSelected) && (
                <g>
                  <rect x={m.x - 70} y={m.y - 36} width={140} height={28} rx={4} fill="#0f172a" stroke="#334155" />
                  <text x={m.x} y={m.y - 24} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                    {m.label.slice(0, 22)}
                  </text>
                  {m.threatScore != null && (
                    <text x={m.x} y={m.y - 14} textAnchor="middle" fill="#64748b" fontSize={8}>
                      Threat {Math.round(m.threatScore)}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-[10px]">
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> High
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /> Officer safety
        </span>
      </div>
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 font-mono">
        {markers.length} geospatial events · WGS84
      </div>
    </div>
  );
}
