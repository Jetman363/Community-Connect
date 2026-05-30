"use client";

import Link from "next/link";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import type { MarketplaceListingDto } from "@/types/marketplace";

export function FeaturedRow({
  listings,
  onSelect,
  onToggleFavorite,
  title = "Featured Listings",
  href,
}: {
  listings: MarketplaceListingDto[];
  onSelect: (l: MarketplaceListingDto) => void;
  onToggleFavorite?: (id: string) => void;
  title?: string;
  href?: string;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {title}
        </h2>
        {href && (
          <Link href={href} className="text-xs text-[var(--accent)] hover:underline">
            See all →
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        {listings.map((listing) => (
          <div key={listing.id} className="min-w-[260px] snap-start md:min-w-0">
            <MarketplaceListingCard
              listing={listing}
              onSelect={() => onSelect(listing)}
              onToggleFavorite={onToggleFavorite}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}
