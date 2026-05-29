"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedPost } from "@/types/feed";
import { fetchFeed, createPost as apiCreatePost } from "@/lib/api/client";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
import { useSocket } from "@/hooks/use-socket";

const CATEGORY_MAP: Record<string, string> = {
  general: "GENERAL",
  safety: "SAFETY",
  events: "EVENTS",
  "lost-found": "NEIGHBORHOOD",
  recommendations: "NEIGHBORHOOD",
  neighborhood: "NEIGHBORHOOD",
  marketplace: "MARKETPLACE",
  hoa: "HOA",
};

export function useFeed(options: { category?: string; sort?: "latest" | "trending" } = {}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState<string>("db");
  const { on } = useSocket();

  const load = useCallback(
    async (append = false, nextCursor?: string | null) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const category =
          options.category && options.category !== "all"
            ? CATEGORY_MAP[options.category] ?? options.category.toUpperCase()
            : undefined;

        const res = await fetchFeed({
          sort: options.sort ?? "latest",
          category,
          cursor: append ? (nextCursor ?? cursor ?? undefined) : undefined,
        });

        setPosts((prev) => (append ? [...prev, ...res.items] : res.items));
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setSource(res.source ?? "db");
      } catch {
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [options.category, options.sort, cursor]
  );

  useEffect(() => {
    setCursor(null);
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.category, options.sort]);

  useEffect(() => {
    const unsubPost = on(SOCKET_EVENTS.POST_NEW, (data) => {
      const post = data as FeedPost;
      setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    });
    const unsubReaction = on(SOCKET_EVENTS.REACTION_UPDATE, (data) => {
      const payload = data as { postId: string; counts: Record<string, number> };
      setPosts((prev) =>
        prev.map((p) =>
          p.id === payload.postId
            ? {
                ...p,
                likes: payload.counts.LIKE ?? p.likes,
                helpful: payload.counts.HELPFUL ?? p.helpful,
                support: payload.counts.SUPPORT ?? p.support,
              }
            : p
        )
      );
    });
    return () => {
      unsubPost?.();
      unsubReaction?.();
    };
  }, [on]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    load(true, cursor);
  }, [hasMore, loadingMore, load, cursor]);

  const addPost = useCallback(async (body: Record<string, unknown>) => {
    const post = await apiCreatePost(body);
    setPosts((prev) => [post, ...prev]);
    return post;
  }, []);

  const updatePostLocal = useCallback((postId: string, patch: Partial<FeedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...patch } : p)));
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    addPost,
    updatePostLocal,
    source,
    refresh: () => load(false),
  };
}
