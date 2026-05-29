"use client";

import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { FilterChips } from "@/components/ui/filter-chips";
import { Badge } from "@/components/ui/badge";
import { mockAlerts, mockEvents, mockBusinesses } from "@/lib/mock-data";
import { useState } from "react";
import { MapPin, Bell, Calendar, Building2 } from "lucide-react";

const layers = [
  { id: "all", label: "All" },
  { id: "alerts", label: "Alerts" },
  { id: "events", label: "Events" },
  { id: "businesses", label: "Businesses" },
] as const;

type Layer = (typeof layers)[number]["id"];

export default function MapPage() {
  const [layer, setLayer] = useState<Layer>("all");

  const pins = [
    ...mockAlerts.map((a) => ({ type: "alert" as const, title: a.title, location: a.location, severity: a.severity })),
    ...mockEvents.map((e) => ({ type: "event" as const, title: e.title, location: e.location })),
    ...mockBusinesses.map((b) => ({ type: "business" as const, title: b.name, location: b.distance })),
  ];

  const displayPins =
    layer === "all"
      ? pins
      : layer === "alerts"
        ? pins.filter((p) => p.type === "alert")
        : layer === "events"
          ? pins.filter((p) => p.type === "event")
          : pins.filter((p) => p.type === "business");

  return (
    <PageTransition>
      <PageHeader
        title="Community Map"
        description="Alerts, events, businesses, and reports on one map"
      />

      <FilterChips options={[...layers]} value={layer} onChange={setLayer} className="mb-4" />

      <MapPlaceholder label="Interactive community map" height="h-[50vh]" className="mb-6" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayPins.slice(0, 9).map((pin, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]">
              {pin.type === "alert" && <Bell className="h-4 w-4 text-[var(--emergency)]" />}
              {pin.type === "event" && <Calendar className="h-4 w-4 text-[var(--accent)]" />}
              {pin.type === "business" && <Building2 className="h-4 w-4 text-emerald-500" />}
            </div>
            <div>
              <p className="font-medium text-sm">{pin.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <MapPin className="h-3 w-3" />
                {pin.location}
              </p>
              {"severity" in pin && (
                <Badge variant="emergency" className="mt-2">
                  {pin.severity}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
