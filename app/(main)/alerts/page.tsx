"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChips } from "@/components/ui/filter-chips";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { Modal } from "@/components/ui/modal";
import { AlertCard } from "@/components/cards/alert-card";
import { Badge } from "@/components/ui/badge";
import { mockAlerts, alertCategories, type AlertCategory, type MockAlert } from "@/lib/mock-data";
import { MapPin, Clock } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export default function AlertsPage() {
  const [category, setCategory] = useState<AlertCategory | "all">("all");
  const [selected, setSelected] = useState<MockAlert | null>(null);

  const filtered =
    category === "all"
      ? mockAlerts
      : mockAlerts.filter((a) => a.category === category);

  return (
    <PageTransition>
      <PageHeader
        title="Safety Alerts"
        description="Public safety advisories, weather warnings, and emergency notifications"
      />

      <FilterChips
        options={alertCategories}
        value={category}
        onChange={setCategory}
        className="mb-4"
      />

      <MapPlaceholder label="Alert locations map" height="h-48" className="mb-6" />

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onClick={() => setSelected(alert)} />
        ))}
      </div>

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
                {selected.location}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Issued {formatRelative(selected.createdAt)}
              </p>
              {selected.expiresAt && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Expires {new Date(selected.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">Source: {selected.source}</p>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
