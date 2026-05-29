"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { FilterChipsAnimated } from "@/components/ui/filter-chips";
import { AlertCard } from "@/components/cards/alert-card";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { mockAlerts, alertCategories, type AlertCategory } from "@/lib/mock-data/alerts";
import { Modal } from "@/components/ui/modal";
import type { MockAlert } from "@/lib/mock-data/alerts";

export default function AlertsPage() {
  const [category, setCategory] = useState<AlertCategory | "all">("all");
  const [selected, setSelected] = useState<MockAlert | null>(null);

  const filtered =
    category === "all" ? mockAlerts : mockAlerts.filter((a) => a.category === category);

  const emergencyCount = mockAlerts.filter((a) => a.severity === "EMERGENCY").length;

  return (
    <PageTransition>
      <PageHeader
        title="Alerts Center"
        description={
          emergencyCount > 0
            ? `${emergencyCount} active emergency alert${emergencyCount > 1 ? "s" : ""}`
            : "Public safety advisories and community notifications"
        }
      />

      <MapPlaceholder label="Alert map" height="h-56" className="mb-6" />

      <FilterChipsAnimated
        options={alertCategories}
        value={category}
        onChange={setCategory}
        className="mb-6"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onClick={() => setSelected(alert)} />
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        description={selected?.source}
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm">{selected.description}</p>
            <div className="rounded-xl bg-[var(--muted)] p-4 text-sm">
              <p>
                <strong>Location:</strong> {selected.location}
              </p>
              <p className="mt-1">
                <strong>Severity:</strong> {selected.severity}
              </p>
              <p className="mt-1">
                <strong>Category:</strong> {selected.category}
              </p>
            </div>
            <MapPlaceholder label="Alert location" height="h-40" />
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}
