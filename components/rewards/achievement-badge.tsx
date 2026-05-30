"use client";

import { Badge } from "@/components/ui/badge";
import type { AchievementDto } from "@/types/engagement";
import { cn } from "@/lib/utils";

export function AchievementBadge({ achievement }: { achievement: AchievementDto }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border p-4 text-center transition-opacity",
        achievement.earned ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--border)] opacity-50"
      )}
    >
      <span className="text-3xl">{achievement.icon ?? "🏅"}</span>
      <h4 className="mt-2 text-sm font-semibold">{achievement.title}</h4>
      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
        {achievement.description}
      </p>
      <Badge variant={achievement.earned ? "accent" : "default"} className="mt-2">
        +{achievement.points} pts
      </Badge>
    </div>
  );
}
