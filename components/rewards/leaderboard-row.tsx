"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@/types/engagement";
import { cn } from "@/lib/utils";

export function LeaderboardRow({
  entry,
  highlight,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3",
        highlight ? "bg-[var(--accent)]/10 border border-[var(--accent)]/20" : "hover:bg-[var(--muted)]"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          entry.rank <= 3 ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)]"
        )}
      >
        {entry.rank}
      </span>
      <Avatar initials={entry.avatar ?? entry.displayName.slice(0, 2)} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.displayName}</p>
        <p className="text-xs text-[var(--muted-foreground)]">Level {entry.level}</p>
      </div>
      <Badge variant="default">{entry.balance.toLocaleString()} pts</Badge>
    </div>
  );
}
