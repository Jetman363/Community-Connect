"use client";

import { Badge } from "@/components/ui/badge";
import type { PointsDto } from "@/types/engagement";
import { Star } from "lucide-react";

export function PointsBadge({ points }: { points: PointsDto }) {
  const progress = Math.min(100, (points.balance / points.nextLevelAt) * 100);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/5 to-[var(--card)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">Community Points</p>
          <p className="text-2xl font-bold">{points.balance.toLocaleString()}</p>
        </div>
        <Badge variant="accent" className="gap-1">
          <Star className="h-3 w-3" />
          Level {points.level}
        </Badge>
      </div>
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {points.nextLevelAt - points.balance} pts to Level {points.level + 1}
        </p>
      </div>
    </div>
  );
}
