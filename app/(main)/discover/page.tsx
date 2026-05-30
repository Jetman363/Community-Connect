"use client";

import { useCallback, useRef, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { DiscoverCard } from "@/components/discover/discover-card";
import { useDiscoverFeed } from "@/hooks/use-discover-feed";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

const filters = [
  { id: "all", label: "All" },
  { id: "post", label: "Posts" },
  { id: "marketplace", label: "Marketplace" },
  { id: "deal", label: "Deals" },
  { id: "event", label: "Events" },
  { id: "group", label: "Groups" },
  { id: "news", label: "News" },
];

export default function DiscoverPage() {
  const [filter, setFilter] = useState("all");
  const { items, loading, hasMore, loadMore, refresh } = useDiscoverFeed(
    filter === "all" ? undefined : filter
  );
  const { toast } = useToast();
  const observer = useRef<IntersectionObserver | null>(null);

  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore) loadMore();
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  return (
    <PageTransition>
      <PageHeader
        title="Discover"
        description="Personalized feed — swipe through what's happening near you"
      />

      <FilterChips options={filters} value={filter} onChange={setFilter} className="mb-6" />

      <PullToRefresh onRefresh={async () => refresh()}>
      <div className="flex flex-col items-center gap-6 md:flex-row md:flex-wrap md:justify-center">
        {items.map((item, i) => (
          <div key={item.id} ref={i === items.length - 1 ? lastRef : undefined}>
            <DiscoverCard
              item={item}
              onSave={() => toast("Saved to your collection", "success")}
              onShare={() => toast("Link copied!", "info")}
            />
          </div>
        ))}
      </div>

      {loading && (
        <div className="mt-6 flex justify-center gap-4">
          <Skeleton className="h-[420px] w-[280px] rounded-2xl" />
          <Skeleton className="hidden h-[420px] w-[280px] rounded-2xl md:block" />
        </div>
      )}
      </PullToRefresh>
    </PageTransition>
  );
}
