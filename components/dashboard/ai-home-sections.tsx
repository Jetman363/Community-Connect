"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HorizontalScrollSection } from "@/components/engagement/horizontal-scroll-section";
import { RecommendationCard } from "@/components/discover/recommendation-card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { sectionHeaderForInterest } from "@/lib/ai/feed-ranking";
import type { LifestyleRecommendation } from "@/types/engagement";
import { usePersonalization } from "@/hooks/use-personalization";

export function AiHomeSections() {
  const { profile } = usePersonalization();
  const [picked, setPicked] = useState<LifestyleRecommendation[]>([]);
  const [because, setBecause] = useState<LifestyleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<{ items: LifestyleRecommendation[] }>("/api/recommendations/lifestyle")
      .then((d) => {
        const items = d.items ?? [];
        setPicked(items.slice(0, 3));
        setBecause(items.slice(3, 6));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const primaryInterest = profile.interests[0] ?? "events";

  if (loading) {
    return (
      <div className="mb-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  return (
    <>
      <HorizontalScrollSection title="Picked for you" href="/discover">
        {(picked.length > 0 ? picked : []).map((rec) => (
          <RecommendationCard key={rec.id} item={rec} />
        ))}
      </HorizontalScrollSection>

      {because.length > 0 && (
        <HorizontalScrollSection
          title={sectionHeaderForInterest(primaryInterest)}
          href="/discover"
        >
          {because.map((rec) => (
            <RecommendationCard key={rec.id} item={rec} />
          ))}
        </HorizontalScrollSection>
      )}

      <section className="mb-8 rounded-2xl border border-[var(--border)] glass-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title">Community insights</h2>
          <Link href="/discover" className="text-sm text-[var(--accent)] hover:underline">
            See more
          </Link>
        </div>
        <CommunityInsightsPreview />
      </section>
    </>
  );
}

function CommunityInsightsPreview() {
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ headline: string; insights: { title: string; summary: string }[] }>(
      "/api/ai/insights"
    )
      .then((d) => setHeadline(d.insights[0]?.summary ?? d.headline))
      .catch(() => setHeadline("Neighbors are active in marketplace and weekend events."));
  }, []);

  return (
    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
      {headline ?? "Loading AI summary…"}
    </p>
  );
}
