"use client";

import Link from "next/link";
import { ChevronRight, Bell } from "lucide-react";
import { AlertCard } from "@/components/cards/alert-card";
import { getMockSafetyAlerts } from "@/lib/api/fallback-safety";

/** Compact safety panel — de-emphasized on lifestyle home */
export function CompactAlertsPanel() {
  const alerts = getMockSafetyAlerts().filter((a) => a.active).slice(0, 2);

  if (alerts.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
          Safety Alerts
        </h2>
        <Link
          href="/alerts"
          className="flex items-center gap-0.5 text-xs text-[var(--accent)] hover:underline"
        >
          All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} compact />
        ))}
      </div>
    </section>
  );
}
