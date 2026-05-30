"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { AlertCard } from "@/components/cards/alert-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAlerts } from "@/hooks/use-alerts";
import type { SafetyAlertDto } from "@/types/safety";
import { MapPin, Clock, Radio, Search } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { MapCanvasDynamic } from "@/components/map/map-canvas-dynamic";
import { useMapMarkers } from "@/hooks/use-map-markers";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "CRIME", label: "Crime" },
  { id: "WEATHER", label: "Weather" },
  { id: "TRAFFIC", label: "Traffic" },
  { id: "MISSING", label: "Missing" },
  { id: "HOA", label: "HOA" },
  { id: "COMMUNITY", label: "Community" },
] as const;

export default function AlertsPage() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SafetyAlertDto | null>(null);
  const { items, loading, source, acknowledge, bookmark } = useAlerts({
    category: category === "all" ? undefined : category,
    search: search || undefined,
  });
  const { markers } = useMapMarkers({ layers: "alerts" });

  return (
    <PageTransition>
      <PageHeader
        title="Safety Alerts"
        description="Public safety advisories, weather warnings, and emergency notifications"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {source === "mock" && (
          <Badge variant="accent">Demo data</Badge>
        )}
      </div>

      <FilterChips
        options={[...CATEGORIES]}
        value={category}
        onChange={setCategory}
        className="mb-4"
      />

      <div className="mb-6 overflow-hidden rounded-2xl">
        <MapCanvasDynamic markers={markers} className="h-48" onMarkerClick={(m) => {
          const a = items.find((i) => i.id === m.id);
          if (a) setSelected(a);
        }} />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--emergency)]/30 bg-[var(--emergency)]/5 px-3 py-2">
        <Radio className="h-4 w-4 animate-pulse text-[var(--emergency)]" />
        <span className="text-sm font-medium">Dispatch feed — live updates</span>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading alerts…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => setSelected(alert)}
              onAcknowledge={(e) => {
                e.stopPropagation();
                void acknowledge(alert.id);
              }}
              onBookmark={(e) => {
                e.stopPropagation();
                void bookmark(alert.id, alert.bookmarked);
              }}
            />
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="emergency">{selected.severity}</Badge>
              <Badge>{selected.category}</Badge>
              {selected.active && <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-sm leading-relaxed">{selected.description}</p>
            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selected.locationLabel ?? "See map"}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Issued {formatRelative(selected.createdAt)}
              </p>
            </div>
            {selected.source && (
              <p className="text-xs text-[var(--muted-foreground)]">Source: {selected.source}</p>
            )}
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
