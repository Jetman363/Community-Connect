"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MockBusiness } from "@/lib/mock-data/businesses";
import { cn } from "@/lib/utils";

export function BusinessCard({
  business,
  onSelect,
  compact,
}: {
  business: MockBusiness;
  onSelect?: () => void;
  compact?: boolean;
}) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className={cn(
        "cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md",
        compact ? "flex gap-4 p-4" : ""
      )}
    >
      {business.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={business.imageUrl}
          alt=""
          className={cn(compact ? "h-20 w-20 rounded-xl object-cover" : "h-36 w-full object-cover")}
        />
      )}
      <div className={cn("p-4", compact && "flex-1 p-0")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{business.name}</h3>
              {business.verified && (
                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{business.categoryLabel}</p>
          </div>
          <Badge variant={business.available ? "success" : "default"}>
            {business.available ? "Open" : "Closed"}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 font-medium">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {business.rating}
            <span className="font-normal text-[var(--muted-foreground)]">
              ({business.reviewCount})
            </span>
          </span>
          <span className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <MapPin className="h-3.5 w-3.5" />
            {business.distance}
          </span>
        </div>
        {!compact && (
          <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
            {business.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {business.tags.map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        {!compact && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-3.5 w-3.5" />
              Call
            </Button>
            <Button size="sm" className="flex-1">
              View Profile
            </Button>
          </div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
          <Clock className="h-3 w-3" />
          {business.hours}
        </div>
      </div>
    </motion.article>
  );
}
