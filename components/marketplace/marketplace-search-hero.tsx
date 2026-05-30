"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Map, LayoutGrid, List, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketplaceSearchHero({
  search,
  onSearchChange,
  location,
  onLocationChange,
  viewMode,
  onViewModeChange,
  sticky,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  location: string;
  onLocationChange: (v: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (v: "grid" | "list") => void;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-6 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm",
        sticky && "sticky top-16 z-30 md:top-20"
      )}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search listings, jobs, services..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 pl-10 text-base"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[140px] flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/map?layer=listings">
          <Button variant="outline" size="sm" className="gap-1">
            <Map className="h-4 w-4" />
            Map
          </Button>
        </Link>
        <div className="flex rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "rounded-l-lg p-2 transition-colors",
              viewMode === "grid"
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={cn(
              "rounded-r-lg p-2 transition-colors",
              viewMode === "list"
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
