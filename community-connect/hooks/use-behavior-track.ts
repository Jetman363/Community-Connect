"use client";

import { useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import type { BehaviorEventInput } from "@/types/radius";

/** Fire-and-forget behavior tracking for AI learning. */
export function useBehaviorTrack() {
  const queueRef = useRef<BehaviorEventInput[]>([]);
  const flushingRef = useRef(false);

  const flush = useCallback(async () => {
    if (flushingRef.current || queueRef.current.length === 0) return;
    flushingRef.current = true;
    const batch = queueRef.current.splice(0, 5);
    try {
      await Promise.all(
        batch.map((event) =>
          apiFetch("/api/user/behavior", {
            method: "POST",
            body: JSON.stringify(event),
          }).catch(() => undefined)
        )
      );
    } finally {
      flushingRef.current = false;
      if (queueRef.current.length > 0) void flush();
    }
  }, []);

  const track = useCallback(
    (event: BehaviorEventInput) => {
      queueRef.current.push(event);
      void flush();
    },
    [flush]
  );

  const trackClick = useCallback(
    (entityType: string, entityId?: string, metadata?: Record<string, unknown>) => {
      track({ eventType: "CLICK", entityType, entityId, metadata });
    },
    [track]
  );

  const trackView = useCallback(
    (entityType: string, entityId?: string, metadata?: Record<string, unknown>) => {
      track({ eventType: "VIEW", entityType, entityId, metadata });
    },
    [track]
  );

  const trackSearch = useCallback(
    (query: string, metadata?: Record<string, unknown>) => {
      track({ eventType: "SEARCH", entityType: "search", metadata: { query, ...metadata } });
    },
    [track]
  );

  return { track, trackClick, trackView, trackSearch };
}
