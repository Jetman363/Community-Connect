"use client";

import { useCallback, useEffect, useState } from "react";
import type { MarketplaceListingDto } from "@/types/marketplace";
import { fetchListings, toggleListingFavorite } from "@/lib/api/client";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { useSocket } from "@/hooks/use-socket";

export const marketplaceCategories = [
  { id: "all", label: "All" },
  { id: "BUY_SELL", label: "Buy & Sell" },
  { id: "SERVICES", label: "Services" },
  { id: "JOBS", label: "Jobs" },
  { id: "GIG", label: "Gigs" },
  { id: "CLASSIFIEDS", label: "Classifieds" },
  { id: "HOUSING", label: "Housing" },
] as const;

export function useMarketplace(options: { category?: string; search?: string; featured?: boolean } = {}) {
  const [listings, setListings] = useState<MarketplaceListingDto[]>([]);
  const [featured, setFeatured] = useState<MarketplaceListingDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState("db");
  const { on } = useSocket();

  const load = useCallback(
    async (append = false, nextCursor?: string | null) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetchListings({
          category: options.category,
          search: options.search,
          featured: options.featured,
          cursor: append ? (nextCursor ?? cursor ?? undefined) : undefined,
        });
        setListings((prev) => (append ? [...prev, ...res.items] : res.items));
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setSource(res.source ?? "db");
      } catch {
        if (!append) setListings([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [options.category, options.search, options.featured, cursor]
  );

  const loadFeatured = useCallback(async () => {
    try {
      const res = await fetchListings({ featured: true });
      setFeatured(res.items.filter((l) => l.featured || l.promoted).slice(0, 6));
    } catch {
      setFeatured([]);
    }
  }, []);

  useEffect(() => {
    setCursor(null);
    load(false);
    loadFeatured();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.category, options.search]);

  useEffect(() => {
    const unsubNew = on(SOCKET_EVENTS.LISTING_NEW, (data) => {
      const listing = data as MarketplaceListingDto;
      setListings((prev) => (prev.some((l) => l.id === listing.id) ? prev : [listing, ...prev]));
    });
    const unsubUpdate = on(SOCKET_EVENTS.LISTING_UPDATE, (data) => {
      const listing = data as MarketplaceListingDto;
      setListings((prev) => prev.map((l) => (l.id === listing.id ? listing : l)));
    });
    const unsubSold = on(SOCKET_EVENTS.LISTING_SOLD, (data) => {
      const { id } = data as { id: string };
      setListings((prev) => prev.filter((l) => l.id !== id));
    });
    return () => {
      unsubNew?.();
      unsubUpdate?.();
      unsubSold?.();
    };
  }, [on]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    load(true, cursor);
  }, [hasMore, loadingMore, load, cursor]);

  const toggleFavorite = useCallback(async (id: string) => {
    const listing = listings.find((l) => l.id === id);
    if (!listing) return;
    const favorited = listing.favorited ?? false;
    await toggleListingFavorite(id, favorited);
    const patch = { favorited: !favorited };
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setFeatured((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, [listings]);

  return {
    listings,
    featured,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    source,
    toggleFavorite,
    refresh: () => load(false),
  };
}
