"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { DiscoverFeedItem } from "@/types/engagement";
import { mockDiscoverFeed } from "@/lib/mock-data/discover";

export function useDiscoverFeed(category?: string) {
  const [items, setItems] = useState<DiscoverFeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      const offset = reset ? 0 : (cursor ?? 0);
      try {
        const data = await apiFetch<{
          items: DiscoverFeedItem[];
          nextCursor: number | null;
        }>(`/api/discover/feed?limit=8${category ? `&category=${category}` : ""}${offset ? `&cursor=${offset}` : ""}`);
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
      } catch {
        const filtered =
          category && category !== "all"
            ? mockDiscoverFeed.filter((i) => i.type === category)
            : mockDiscoverFeed;
        setItems(filtered);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [category, cursor]
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) void load(false);
  }, [load, loading, hasMore]);

  return { items, loading, hasMore, loadMore, refresh: () => load(true) };
}
