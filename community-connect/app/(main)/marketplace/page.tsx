"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  mockListings,
  listingTypes,
  type ListingType,
  type MockListing,
} from "@/lib/mock-data/marketplace";
import { getUserById } from "@/lib/mock-data";
import { Search, Plus } from "lucide-react";

export default function MarketplacePage() {
  const [type, setType] = useState<ListingType | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockListing | null>(null);

  const filtered = mockListings.filter((l) => {
    const matchType = type === "all" || l.type === type;
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <PageTransition>
      <PageHeader
        title="Marketplace"
        description="Buy, sell, trade, and find jobs in your community"
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <FilterChipsAnimated
        options={listingTypes}
        value={type}
        onChange={setType}
        className="mb-6"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((listing) => (
          <MarketplaceListingCard
            key={listing.id}
            listing={listing}
            onSelect={() => setSelected(listing)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-[var(--muted-foreground)]">No listings found</p>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected ? getUserById(selected.sellerId)?.displayName : undefined}
      >
        {selected && (
          <div className="space-y-4">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt="" className="w-full rounded-xl object-cover" />
            )}
            <p className="text-sm">{selected.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {selected.price === null
                  ? "Trade"
                  : selected.price === 0
                    ? "Free"
                    : `$${selected.price}`}
              </span>
              <Button>Message Seller</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
