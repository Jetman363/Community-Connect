"use client";

import Link from "next/link";
import { HorizontalScrollSection } from "@/components/engagement/horizontal-scroll-section";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import {
  getMockFeaturedListings,
  getMockTrendingListings,
  getMockMarketplaceRecommendations,
} from "@/lib/api/fallback-marketplace";
import { useMemo } from "react";
import type { MarketplaceListingDto } from "@/types/marketplace";
import { Sparkles } from "lucide-react";

export function MarketplaceHighlights({
  onSelect,
}: {
  onSelect?: (l: MarketplaceListingDto) => void;
}) {
  const featured = useMemo(() => getMockFeaturedListings().slice(0, 4), []);
  const trending = useMemo(() => getMockTrendingListings().slice(0, 3), []);
  const recommendations = useMemo(() => getMockMarketplaceRecommendations(), []);

  const highlightListings = featured.length > 0 ? featured : trending;

  return (
    <HorizontalScrollSection title="Marketplace Highlights" href="/marketplace">
      {recommendations.slice(0, 2).map((rec) => {
        const listing = highlightListings.find((l) => l.id === rec.listingId) ?? highlightListings[0];
        if (!listing) return null;
        return (
          <div key={rec.id} className="min-w-[260px] shrink-0 snap-start">
            <div className="mb-1 flex items-center gap-1 text-xs text-[var(--accent)]">
              <Sparkles className="h-3 w-3" />
              {rec.reason}
            </div>
            <MarketplaceListingCard
              listing={listing}
              onSelect={onSelect ? () => onSelect(listing) : undefined}
              compact
            />
          </div>
        );
      })}
      {highlightListings.slice(0, 3).map((listing) => (
        <div key={listing.id} className="min-w-[260px] shrink-0 snap-start">
          <MarketplaceListingCard
            listing={listing}
            onSelect={onSelect ? () => onSelect(listing) : undefined}
            compact
          />
        </div>
      ))}
      <Link
        href="/marketplace"
        className="flex min-w-[120px] shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--accent)] hover:bg-[var(--muted)]"
      >
        Browse all →
      </Link>
    </HorizontalScrollSection>
  );
}
