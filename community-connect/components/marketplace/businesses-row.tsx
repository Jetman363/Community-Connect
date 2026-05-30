"use client";

import Link from "next/link";
import { BusinessCard } from "@/components/cards/business-card";
import type { BusinessDto } from "@/types/marketplace";
import { Building2 } from "lucide-react";

export function BusinessesRow({
  businesses,
  onSelect,
  onToggleFavorite,
}: {
  businesses: BusinessDto[];
  onSelect?: (b: BusinessDto) => void;
  onToggleFavorite?: (id: string) => void;
}) {
  if (businesses.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
          Local Businesses
        </h2>
        <Link href="/marketplace?tab=businesses" className="text-sm text-[var(--accent)] hover:underline">
          View all →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-3 md:overflow-visible">
        {businesses.slice(0, 6).map((business) => (
          <div key={business.id} className="min-w-[280px] snap-start md:min-w-0">
            <BusinessCard
              business={business}
              onSelect={onSelect ? () => onSelect(business) : undefined}
              onToggleFavorite={onToggleFavorite}
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}
