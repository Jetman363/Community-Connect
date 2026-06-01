"use client";

import { motion } from "framer-motion";
import { MapPin, Eye, Bookmark, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MockListing } from "@/lib/mock-data/marketplace";
import { getUserById } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const typeLabels = {
  sell: "For Sale",
  buy: "Wanted",
  trade: "Trade",
  job: "Job",
  free: "Free",
};

const typeVariants = {
  sell: "accent" as const,
  buy: "default" as const,
  trade: "default" as const,
  job: "accent" as const,
  free: "success" as const,
};

export function MarketplaceListingCard({
  listing,
  onSelect,
}: {
  listing: MockListing;
  onSelect?: () => void;
}) {
  const seller = getUserById(listing.sellerId);
  const [saved, setSaved] = useState(listing.saved);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className="cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md"
    >
      {listing.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.imageUrl} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[var(--muted)]">
          <Tag className="h-8 w-8 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={typeVariants[listing.type]}>{typeLabels[listing.type]}</Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSaved(!saved);
            }}
            className={cn(
              "rounded-lg p-1.5 transition-colors hover:bg-[var(--muted)]",
              saved && "text-[var(--accent)]"
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        </div>
        <h3 className="mt-2 font-semibold">{listing.title}</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
          {listing.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">
            {listing.price === null
              ? "Trade"
              : listing.price === 0
                ? "Free"
                : listing.type === "job"
                  ? `$${listing.price}/hr`
                  : `$${listing.price}`}
          </span>
          {listing.condition && (
            <span className="text-xs text-[var(--muted-foreground)]">{listing.condition}</span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.location}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {listing.views}
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          {seller?.displayName} · {formatRelative(listing.createdAt)}
        </p>
      </div>
    </motion.article>
  );
}
