"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketplaceListingCard } from "@/components/cards/marketplace-listing";
import { mockListings, listingTypes, type ListingType, type MockListing } from "@/lib/mock-data";
import { getUserById } from "@/lib/mock-data";
import { Search, MapPin, MessageCircle } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export default function MarketplacePage() {
  const [type, setType] = useState<ListingType | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockListing | null>(null);

  const filtered = mockListings.filter((l) => {
    const matchesType = type === "all" || l.type === type;
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const seller = selected ? getUserById(selected.sellerId) : null;

  return (
    <PageTransition>
      <PageHeader
        title="Marketplace"
        description="Buy, sell, trade, and find jobs within your community"
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <FilterChips options={listingTypes} value={type} onChange={setType} className="mb-6" />

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

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && seller && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="accent">{selected.type}</Badge>
              {selected.price !== undefined && (
                <span className="text-xl font-semibold">${selected.price}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <MapPin className="h-4 w-4" />
              {selected.location}
            </div>
            <p className="text-sm">
              Listed by <strong>{seller.displayName}</strong> ·{" "}
              {formatRelative(selected.createdAt)}
            </p>
            <Button className="w-full">
              <MessageCircle className="h-4 w-4" />
              Message Seller
            </Button>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
