"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { AiHomeSections } from "@/components/dashboard/ai-home-sections";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { apiFetch } from "@/lib/api/client";
import { mockDeals } from "@/lib/mock-data/deals";
import { mockFamilyActivities } from "@/lib/mock-data/family";
import { mockNewsArticles } from "@/lib/mock-data/news";
import { mockActivityFeed, mockTrendingItems } from "@/lib/mock-data/discover";
import { usePersonalization } from "@/hooks/use-personalization";
import { rankDashboardSections, type DashboardSectionId } from "@/lib/personalization/dashboard-sections";
import type { LifestyleRecommendation, TrendingItemDto } from "@/types/engagement";
import type { ForYouRecommendation } from "@/types/radius";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { profile, recommendations: forYou } = usePersonalization();
  const [recommendations, setRecommendations] = useState<LifestyleRecommendation[]>([]);
  const [trending, setTrending] = useState<TrendingItemDto[]>(mockTrendingItems);

  const sectionOrder = useMemo(
    () => rankDashboardSections(profile.interests),
    [profile.interests]
  );

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

  const sections: Record<DashboardSectionId, React.ReactNode> = {
    welcome: <WelcomeHeader key="welcome" />,
    checkin: (
      <div key="checkin" className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <DailyCheckInButton streak={7} />
        <Link href="/rewards" className="text-sm text-[var(--accent)] hover:underline">
          View rewards →
        </Link>
      </div>
    ),
    alerts: (
      <div key="alerts" className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>
        <CompactAlertsPanel />
      </div>
    ),
    marketplace: <MarketplaceHighlights key="marketplace" />,
    forYou: (
      <HorizontalScrollSection key="forYou" title="For You" href="/discover">
        {(forYou.length > 0 ? forYou : []).map((rec: ForYouRecommendation) => (
          <Link
            key={rec.id}
            href={rec.href ?? "/discover"}
            className="min-w-[260px] shrink-0 snap-start rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--accent)]/40 transition-colors"
          >
            {rec.imageUrl && (
              <div className="relative h-32 w-full">
                <Image src={rec.imageUrl} alt="" fill className="object-cover" sizes="260px" />
              </div>
            )}
            <div className="p-3">
              <p className="font-medium text-sm line-clamp-1">{rec.title}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{rec.reason}</p>
            </div>
          </Link>
        ))}
        {forYou.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)] py-4">
            Complete onboarding for personalized picks
          </p>
        )}
      </HorizontalScrollSection>
    ),
    events: (
      <HorizontalScrollSection key="events" title="Today's Events" href="/events">
        <EventsCarousel inline />
      </HorizontalScrollSection>
    ),
    deals: (
      <HorizontalScrollSection key="deals" title="Local Deals" href="/deals">
        {mockDeals.slice(0, 5).map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </HorizontalScrollSection>
    ),
    trending: (
      <section key="trending" className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Trending in Your Community</h2>
        <TrendingStrip items={trending} />
      </section>
    ),
    recommendations: (
      <HorizontalScrollSection key="recommendations" title="What to Do Tonight" href="/discover">
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
    ),
    activity: (
      <section key="activity" className="mb-8">
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
    ),
    news: (
      <HorizontalScrollSection key="news" title="Local News" href="/news">
        {mockNewsArticles.slice(0, 4).map((article) => (
          <div key={article.id} className="min-w-[300px] shrink-0 snap-start">
            <NewsCard article={article} />
          </div>
        ))}
      </HorizontalScrollSection>
    ),
    family: (
      <HorizontalScrollSection key="family" title="Family Activities" href="/family">
        {mockFamilyActivities.slice(0, 5).map((a) => (
          <FamilyActivityCard key={a.id} activity={a} />
        ))}
      </HorizontalScrollSection>
    ),
    businesses: (
      <section key="businesses" className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Nearby Businesses</h2>
        <NearbyServices />
      </section>
    ),
    ai: <AiHomeSections key="ai" />,
    feed: <CommunityFeedSection key="feed" />,
  };

  return (
    <PageTransition>
      {sectionOrder.map((id) => sections[id])}
      <QuickActionFab />
    </PageTransition>
  );
}
