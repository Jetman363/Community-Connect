"use client";

import { MapPin } from "lucide-react";

export function MapFallback({
  label = "Map unavailable",
  hint = "Set NEXT_PUBLIC_GOOGLE_MAPS_KEY to enable interactive maps.",
  height = "h-[50vh]",
}: {
  label?: string;
  hint?: string;
  height?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 ${height}`}
    >
      <MapPin className="mb-2 h-8 w-8 text-[var(--muted-foreground)]" />
      <p className="font-medium text-sm">{label}</p>
      <p className="mt-1 max-w-xs text-center text-xs text-[var(--muted-foreground)]">{hint}</p>
    </div>
  );
}
