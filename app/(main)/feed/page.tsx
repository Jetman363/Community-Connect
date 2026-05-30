"use client";

import { useState, useRef, useEffect } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { SwipeableFeedCard } from "@/components/feed/swipeable-feed-card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { PostComposer } from "@/components/feed/post-composer";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeed } from "@/hooks/use-feed";
import { PageHeroBanner } from "@/components/ui/page-hero-banner";
import { CommunityImage } from "@/components/ui/community-image";
import { communityPhotos } from "@/lib/images/community-photos";
import { postCategories } from "@/lib/mock-data/posts";
import { FeedLoginPrompt } from "@/components/feed/feed-login-prompt";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"latest" | "trending">("latest");
  const { posts, loading, loadingMore, hasMore, loadMore, addPost, source, unauthorized, refresh } =
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

      <PageHeroBanner
        src={communityPhotos.people.neighbors}
        alt="Neighbors chatting outdoors in the community"
        title="What's happening nearby"
        description="Share updates, ask questions, and stay connected"
        height="h-32 md:h-36"
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

      <PullToRefresh onRefresh={async () => refresh()}>
      <div className="mx-auto max-w-2xl space-y-4">
        <PostComposer onPost={addPost} />

        {unauthorized ? (
          <FeedLoginPrompt redirect="/feed" />
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          posts.map((post) => <SwipeableFeedCard key={post.id} post={post} />)
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
          <div className="flex flex-col items-center py-12 text-center">
            <div className="relative mb-4 h-40 w-56 overflow-hidden rounded-2xl">
              <CommunityImage
                src={communityPhotos.empty.feed}
                alt="Community gathering in a local park"
                fill
                sizes="224px"
                className="object-cover"
                rounded="2xl"
              />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              No posts yet — be the first to share!
            </p>
          </div>
        )}
      </div>
      </PullToRefresh>
    </PageTransition>
  );
}
