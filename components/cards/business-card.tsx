"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone, CheckCircle2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommunityImage } from "@/components/ui/community-image";
import { businessCoverPhoto } from "@/lib/images/community-photos";
import type { BusinessDto } from "@/types/marketplace";
import { cn } from "@/lib/utils";

function hoursSummary(hours: Record<string, unknown> | null): string {
  if (!hours) return "Hours not listed";
  if (typeof hours.summary === "string") return hours.summary;
  return "See profile for hours";
}

function distanceLabel(m?: number) {
  if (m == null) return null;
  const mi = m / 1609;
  return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
}

export function BusinessCard({
  business,
  onSelect,
  onToggleFavorite,
  compact,
}: {
  business: BusinessDto;
  onSelect?: () => void;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}) {
  const image =
    business.coverPhotoUrl ??
    business.logoUrl ??
    business.imageUrl ??
    businessCoverPhoto(business.category);
  const dist = distanceLabel(business.distanceM);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
        compact && "flex gap-4 p-4"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          compact ? "h-20 w-20 rounded-xl" : "h-36 w-full"
        )}
      >
        <CommunityImage
          src={image}
          alt={`${business.name} storefront`}
          fill
          sizes={compact ? "80px" : "(max-width: 640px) 100vw, 400px"}
          className="object-cover"
          rounded={compact ? "xl" : "none"}
        />
      </div>
      <div className={cn("p-4", compact && "flex-1 p-0")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{business.name}</h3>
              {business.verified && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{business.category}</p>
          </div>
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(business.id);
                }}
                className={cn(
                  "rounded-lg p-1.5 transition-colors hover:bg-[var(--muted)]",
                  business.favorited && "text-[var(--accent)]"
                )}
                aria-label="Favorite business"
              >
                <Bookmark className={cn("h-4 w-4", business.favorited && "fill-current")} />
              </button>
            )}
            <Badge variant="success">Open</Badge>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {business.rating.toFixed(1)}
            <span className="font-normal text-[var(--muted-foreground)]">
              ({business.reviewCount})
            </span>
          </span>
          {dist && (
            <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
              <MapPin className="h-3.5 w-3.5" />
              {dist}
            </span>
          )}
        </div>
        {!compact && business.description && (
          <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
            {business.description}
          </p>
        )}
        {business.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {business.categories.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {!compact && (
          <div className="mt-4 flex gap-2">
            {business.phone && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${business.phone}`;
                }}
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            )}
            <Button size="sm" className="flex-1" onClick={(e) => e.stopPropagation()}>
              View Profile
            </Button>
          </div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Clock className="h-3 w-3" />
          {hoursSummary(business.hours)}
        </div>
      </div>
    </motion.article>
  );
}
