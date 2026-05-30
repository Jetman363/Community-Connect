"use client";

import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SellerSummary } from "@/types/marketplace";

export function SellerBadge({
  seller,
  size = "sm",
}: {
  seller: SellerSummary;
  size?: "sm" | "md";
}) {
  const score = seller.reputationScore;
  const tier =
    score != null && score >= 4.8
      ? "top"
      : score != null && score >= 4.5
        ? "trusted"
        : seller.verified
          ? "verified"
          : null;

  if (!tier) return null;

  const labels = {
    top: "Top Seller",
    trusted: "Trusted",
    verified: "Verified",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        tier === "top" && "bg-amber-500/15 text-amber-700",
        tier === "trusted" && "bg-emerald-500/15 text-emerald-700",
        tier === "verified" && "bg-blue-500/15 text-blue-700"
      )}
    >
      {tier === "verified" ? (
        <BadgeCheck className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      ) : (
        <Star className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", "fill-current")} />
      )}
      {labels[tier]}
    </span>
  );
}

export function SellerBadgeRow({ seller }: { seller: SellerSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{seller.displayName}</span>
      <SellerBadge seller={seller} />
      {seller.reputationScore != null && (
        <span className="flex items-center gap-0.5 text-xs text-[var(--muted-foreground)]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {seller.reputationScore.toFixed(1)}
          {seller.totalSales != null && seller.totalSales > 0 && (
            <span> · {seller.totalSales} sales</span>
          )}
        </span>
      )}
    </div>
  );
}
