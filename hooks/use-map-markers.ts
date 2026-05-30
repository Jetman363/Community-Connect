"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapMarkerDto } from "@/types/safety";
import { apiFetch } from "@/lib/api/client";
import { useSocket } from "@/hooks/use-socket";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

export function useMapMarkers(options?: {
  layers?: string;
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}) {
  const [markers, setMarkers] = useState<MapMarkerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (options?.layers) qs.set("layer", options.layers);
      if (options?.bbox) {
        qs.set("minLat", String(options.bbox.minLat));
        qs.set("maxLat", String(options.bbox.maxLat));
        qs.set("minLng", String(options.bbox.minLng));
        qs.set("maxLng", String(options.bbox.maxLng));
      }
      const res = await apiFetch<{ markers: MapMarkerDto[] }>(`/api/map/markers?${qs}`);
      setMarkers(res.markers);
    } catch {
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [options?.layers, options?.bbox]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = on(SOCKET_EVENTS.MAP_MARKER_UPDATE, () => load());
    return () => unsub?.();
  }, [on, load]);

  return { markers, loading, reload: load };
}
