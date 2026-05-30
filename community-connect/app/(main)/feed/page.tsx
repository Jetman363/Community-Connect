"use client";

import { useState, useRef, useEffect } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { FeedPostCard } from "@/components/cards/feed-post";
import { PostComposer } from "@/components/feed/post-composer";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/hooks/use-feed";
import { postCategories, type MockPost } from "@/lib/mock-data/posts";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const { posts, loading, loadingMore, hasMore, loadMore, addPost, updatePostLocal, source } =
    useFeed({ category, sort });
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <PageTransition>
      <PageHeader
        title="Community Feed"
        description="Posts, polls, and updates from your neighbors"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterChipsAnimated
          options={[
            { id: "latest", label: "Latest" },
            { id: "trending", label: "Trending" },
          ]}
          value={sort}
          onChange={(v) => setSort(v as "latest" | "trending")}
        />
        {source === "mock" && (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
            Demo data (DB offline)
          </span>
        )}
      </div>

      <FilterChipsAnimated
        options={postCategories}
        value={category}
        onChange={setCategory}
        className="mb-6"
      />

      <div className="mx-auto max-w-2xl space-y-4">
        <PostComposer onPost={addPost} />

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          posts.map((post) => (
            <FeedPostCard key={post.id} post={post as unknown as MockPost} />
          ))
        )}

        {loadingMore && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />

        {!hasMore && posts.length > 0 && !loading && (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            You&apos;re all caught up
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No posts yet — be the first to share!
          </p>
        )}
      </div>
    </PageTransition>
  );
}
