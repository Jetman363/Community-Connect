"use client";

import { motion } from "framer-motion";
import { MapPin, Eye, Bookmark, Tag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceListingDto } from "@/types/marketplace";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  FOR_SALE: "For Sale",
  WANTED: "Wanted",
  JOB: "Job",
  SERVICE: "Service",
};

const categoryLabels: Record<string, string> = {
  BUY_SELL: "Buy & Sell",
  SERVICES: "Services",
  JOBS: "Jobs",
  GIG: "Gig",
  CLASSIFIEDS: "Classified",
  HOUSING: "Housing",
  OTHER: "Other",
};

function priceLabel(listing: MarketplaceListingDto) {
  if (listing.price == null) return listing.negotiable ? "Make offer" : "Contact";
  if (listing.price === 0) return "Free";
  if (listing.category === "JOBS" || listing.category === "GIG") {
    return `$${listing.price}${listing.type === "JOB" ? "/hr" : ""}`;
  }
  return `$${listing.price}${listing.negotiable ? " · negotiable" : ""}`;
}

export function MarketplaceListingCard({
  listing,
  onSelect,
  onToggleFavorite,
  compact,
}: {
  listing: MarketplaceListingDto;
  onSelect?: () => void;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}) {
  const image = listing.imageUrl ?? listing.imageGallery[0];
  const saved = listing.favorited ?? false;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
        compact && "flex gap-3"
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={cn(compact ? "h-24 w-24 shrink-0 object-cover" : "h-44 w-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center bg-[var(--muted)]",
            compact ? "h-24 w-24 shrink-0" : "h-44 w-full"
          )}
        >
          <Tag className="h-8 w-8 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className={cn("p-4", compact && "min-w-0 flex-1 p-2")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <Badge variant="accent">{typeLabels[listing.type] ?? listing.type}</Badge>
            {(listing.featured || listing.promoted) && (
              <Badge variant="default" className="gap-0.5">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(listing.id);
              }}
              className={cn(
                "rounded-lg p-1.5 transition-colors hover:bg-[var(--muted)]",
                saved && "text-[var(--accent)]"
              )}
              aria-label={saved ? "Remove from favorites" : "Save listing"}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            </button>
          )}
        </div>
        <h3 className="mt-2 font-semibold line-clamp-1">{listing.title}</h3>
        {!compact && listing.description && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
            {listing.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">{priceLabel(listing)}</span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {categoryLabels[listing.category] ?? listing.category}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.locationLabel ?? "Local pickup"}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Eye className="h-3 w-3" />
            {listing.viewCount}
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          {listing.seller.displayName} · {formatRelative(listing.createdAt)}
        </p>
      </div>
    </motion.article>
  );
}
