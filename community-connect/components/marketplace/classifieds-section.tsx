"use client";

import Link from "next/link";
import { FilterChips } from "@/components/ui/filter-chips";
import { FeaturedRow } from "./featured-row";
import { classifiedFilters } from "@/lib/mock-data/marketplace";
import type { MarketplaceListingDto } from "@/types/marketplace";

export function ClassifiedsSection({
  listings,
  filter,
  onFilterChange,
  onSelect,
  onToggleFavorite,
}: {
  listings: MarketplaceListingDto[];
  filter: string;
  onFilterChange: (id: string) => void;
  onSelect: (l: MarketplaceListingDto) => void;
  onToggleFavorite?: (id: string) => void;
}) {
  const filtered =
    filter === "all"
      ? listings
      : listings.filter((l) => l.classifiedType === filter);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Community Classifieds</h2>
        <Link href="/marketplace?tab=classifieds" className="text-sm text-[var(--accent)] hover:underline">
          View all →
        </Link>
      </div>
      <FilterChips
        options={classifiedFilters.map((f) => ({ id: f.id, label: f.label }))}
        value={filter}
        onChange={onFilterChange}
        className="mb-4"
      />
      <FeaturedRow
        listings={filtered.slice(0, 4)}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        title=""
      />
    </section>
  );
}
