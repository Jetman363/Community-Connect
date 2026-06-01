"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FeedPostCard } from "@/components/cards/feed-post";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/hooks/use-feed";
import { FeedLoginPrompt } from "@/components/feed/feed-login-prompt";

export function CommunityFeedSection() {
  const { posts, loading, loadingMore, hasMore, loadMore, source } = useFeed({
    sort: "latest",
  });
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Community Feed</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Latest posts from your neighborhood
          </p>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          Full feed <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {source === "mock" && (
        <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
          Demo data
        </span>
      )}

      <div className="mx-auto max-w-2xl space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No posts yet — visit the feed to share an update.
          </p>
        ) : (
          posts.map((post) => <FeedPostCard key={post.id} post={post} />)
        )}

        {loadingMore && <Skeleton className="h-40 w-full" />}
        <div ref={sentinelRef} className="h-2" />

        {!hasMore && posts.length > 3 && !loading && (
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            <Link href="/feed" className="text-[var(--accent)] hover:underline">
              View more on the feed
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
