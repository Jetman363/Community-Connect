"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/ui/page-header";
import { WelcomeHeader, WeatherWidget } from "@/components/dashboard/welcome-header";
import { CompactAlertsPanel } from "@/components/dashboard/compact-alerts-panel";
import { EventsCarousel } from "@/components/dashboard/events-carousel";
import { NearbyServices } from "@/components/dashboard/nearby-services";
import { HorizontalScrollSection } from "@/components/engagement/horizontal-scroll-section";
import { RecommendationCard } from "@/components/discover/recommendation-card";
import { DealCard } from "@/components/deals/deal-card";
import { TrendingStrip } from "@/components/discover/trending-strip";
import { FamilyActivityCard } from "@/components/family/family-activity-card";
import { NewsCard } from "@/components/news/news-card";
import { DailyCheckInButton } from "@/components/engagement/daily-check-in-button";
import { QuickActionFab } from "@/components/engagement/quick-action-fab";
import { MarketplaceHighlights } from "@/components/marketplace/marketplace-highlights";
import { CommunityFeedSection } from "@/components/dashboard/community-feed-section";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { apiFetch } from "@/lib/api/client";
import { mockDeals } from "@/lib/mock-data/deals";
import { mockFamilyActivities } from "@/lib/mock-data/family";
import { mockNewsArticles } from "@/lib/mock-data/news";
import { mockActivityFeed, mockTrendingItems } from "@/lib/mock-data/discover";
import type { LifestyleRecommendation, TrendingItemDto } from "@/types/engagement";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState<LifestyleRecommendation[]>([]);
  const [trending, setTrending] = useState<TrendingItemDto[]>(mockTrendingItems);
  useEffect(() => {
    void Promise.all([
      apiFetch<{ items: LifestyleRecommendation[] }>("/api/recommendations/lifestyle").then(
        (d) => setRecommendations(d.items)
      ),
      apiFetch<{ items: TrendingItemDto[] }>("/api/trending").then((d) =>
        setTrending(d.items.length ? d.items : mockTrendingItems)
      ),
    ]).catch(() => undefined);
  }, []);

  return (
    <PageTransition>
      <WelcomeHeader />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <DailyCheckInButton streak={7} />
        <Link href="/rewards" className="text-sm text-[var(--accent)] hover:underline">
          View rewards →
        </Link>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>
        <CompactAlertsPanel />
      </div>

      <MarketplaceHighlights />

      <CommunityFeedSection />

      <HorizontalScrollSection title="Today's Events" href="/events">
        <EventsCarousel inline />
      </HorizontalScrollSection>

      <HorizontalScrollSection title="Local Deals" href="/deals">
        {mockDeals.slice(0, 5).map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </HorizontalScrollSection>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Trending in Your Community</h2>
        <TrendingStrip items={trending} />
      </section>

      <HorizontalScrollSection title="What to Do Tonight" href="/discover">
        {(recommendations.length > 0
          ? recommendations
          : [
              {
                id: "fallback",
                title: "Explore Discover",
                description: "Personalized picks based on your interests",
                category: "social" as const,
                reason: "Sign in for AI recommendations",
                href: "/discover",
              },
            ]
        ).map((rec) => (
          <RecommendationCard key={rec.id} item={rec} />
        ))}
      </HorizontalScrollSection>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Friends & Activity</h2>
        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          {mockActivityFeed.slice(0, 4).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 py-2"
            >
              <Avatar initials={item.avatar ?? item.displayName.slice(0, 2)} size="sm" />
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{item.displayName}</span>{" "}
                <span className="text-[var(--muted-foreground)]">{item.action}</span>{" "}
                <span className="font-medium">{item.target}</span>
              </div>
              <RelativeTime
                date={item.timestamp}
                className="shrink-0 text-xs text-[var(--muted-foreground)]"
              />
            </motion.div>
          ))}
        </div>
      </section>

      <HorizontalScrollSection title="Local News" href="/news">
        {mockNewsArticles.slice(0, 4).map((article) => (
          <div key={article.id} className="min-w-[300px] shrink-0 snap-start">
            <NewsCard article={article} />
          </div>
        ))}
      </HorizontalScrollSection>

      <HorizontalScrollSection title="Family Activities" href="/family">
        {mockFamilyActivities.slice(0, 5).map((a) => (
          <FamilyActivityCard key={a.id} activity={a} />
        ))}
      </HorizontalScrollSection>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Nearby Businesses</h2>
        <NearbyServices />
      </section>

      <QuickActionFab />
    </PageTransition>
  );
}
