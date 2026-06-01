"use client";

import { useCallback, useEffect, useState } from "react";
import type { BusinessDto } from "@/types/marketplace";
import { fetchBusinesses, toggleBusinessFavorite } from "@/lib/api/client";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { useSocket } from "@/hooks/use-socket";

export const businessCategories = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "home", label: "Home" },
  { id: "automotive", label: "Auto" },
  { id: "health", label: "Health" },
  { id: "professional", label: "Professional" },
  { id: "retail", label: "Retail" },
] as const;

function formatDistance(m?: number) {
  if (m == null) return null;
  const mi = m / 1609;
  return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
}

export function useBusinesses(options: { category?: string; search?: string; verified?: boolean } = {}) {
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("db");
  const { on } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBusinesses({
        category: options.category,
        search: options.search,
        verified: options.verified,
      });
      setBusinesses(res.items);
      setSource(res.source ?? "db");
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [options.category, options.search, options.verified]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsub = on(SOCKET_EVENTS.BUSINESS_ACTIVITY, () => {
      load();
    });
    return () => unsub?.();
  }, [on, load]);

  const toggleFavorite = useCallback(async (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (!biz) return;
    const favorited = biz.favorited ?? false;
    await toggleBusinessFavorite(id, favorited);
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, favorited: !favorited } : b))
    );
  }, [businesses]);

  return {
    businesses,
    loading,
    source,
    toggleFavorite,
    refresh: load,
    formatDistance,
  };
}
