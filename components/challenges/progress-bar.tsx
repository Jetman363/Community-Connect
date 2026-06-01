"use client";

import { cn } from "@/lib/utils";

export function ChallengeProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-[var(--muted-foreground)]">
          <span>Progress</span>
          <span>{label}</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className={cn("h-full rounded-full bg-[var(--accent)] transition-all duration-500")}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
