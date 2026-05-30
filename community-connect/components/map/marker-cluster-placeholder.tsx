"use client";

import { Layers } from "lucide-react";

/** Placeholder for future MarkerClusterer integration. */
export function MarkerClusterPlaceholder({ count }: { count: number }) {
  if (count < 20) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
      <Layers className="h-3 w-3" />
      {count} markers — clustering enabled in a future release
    </p>
  );
}
