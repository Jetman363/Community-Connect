"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { FeedPostCard } from "@/components/cards/feed-post";
import { SkeletonCard } from "@/components/ui/skeleton";
import { mockPosts, postCategories, type PostCategory } from "@/lib/mock-data/posts";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FeedPage() {
  const [category, setCategory] = useState<PostCategory | "all">("all");
  const [visible, setVisible] = useState(4);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const filtered =
    category === "all" ? mockPosts : mockPosts.filter((p) => p.category === category);

  const loadMore = useCallback(() => {
    if (visible >= filtered.length) return;
    setLoading(true);
    setTimeout(() => {
      setVisible((v) => Math.min(v + 2, filtered.length));
      setLoading(false);
    }, 600);
  }, [visible, filtered.length]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <PageTransition>
      <PageHeader
        title="Community Feed"
        description="Posts, updates, and conversations from your neighbors"
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        }
      />

      <FilterChipsAnimated
        options={postCategories}
        value={category}
        onChange={setCategory}
        className="mb-6"
      />

      <div className="mx-auto max-w-2xl space-y-4">
        {filtered.slice(0, visible).map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {loading && <SkeletonCard />}
        <div ref={observerRef} className="h-4" />
        {visible >= filtered.length && (
          <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
            You&apos;re all caught up
          </p>
        )}
      </div>
    </PageTransition>
  );
}
