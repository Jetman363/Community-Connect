"use client";

import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketplaceListingDto } from "@/types/marketplace";

export function ListingGrid({
  listings,
  loading,
  onSelect,
  onToggleFavorite,
}: {
  listings: MarketplaceListingDto[];
  loading?: boolean;
  onSelect: (l: MarketplaceListingDto) => void;
  onToggleFavorite?: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <p className="py-12 text-center text-[var(--muted-foreground)]">No listings found</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 touch-pan-y">
      {listings.map((listing) => (
        <MarketplaceListingCard
          key={listing.id}
          listing={listing}
          onSelect={() => onSelect(listing)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
