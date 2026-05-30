"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { Radio, AlertTriangle } from "lucide-react";

interface OpsIncident {
  id: string;
  type: "report" | "alert";
  title: string;
  severity: string;
  status: string;
  assignee?: string | null;
  createdAt: string;
}

interface OpsDashboard {
  activeIncidents: number;
  unassignedReports: number;
  criticalCount: number;
  avgResponseMin: number;
  placeholderCad?: boolean;
}

export default function OpsPage() {
  const [incidents, setIncidents] = useState<OpsIncident[]>([]);
  const [dashboard, setDashboard] = useState<OpsDashboard | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [items, dash] = await Promise.all([
          apiFetch<{ items: OpsIncident[] }>("/api/ops/incidents"),
          apiFetch<OpsDashboard>("/api/ops/dashboard"),
        ]);
        setIncidents(items.items);
        setDashboard(dash);
      } catch {
        setDashboard({
          activeIncidents: 8,
          unassignedReports: 3,
          criticalCount: 2,
          avgResponseMin: 12,
          placeholderCad: true,
        });
      }
    })();
  }, []);

  const assign = async (id: string) => {
    try {
      await apiFetch(`/api/ops/incidents/${id}?action=assign`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeId: "demo-admin" }),
      });
    } catch {
      /* demo */
    }
  };

  const escalate = async (id: string) => {
    try {
      await apiFetch(`/api/ops/incidents/${id}?action=escalate`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    } catch {
      /* demo */
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Public Safety Ops"
        description="Dispatch feed, incident assignment, and escalation (CAD integration placeholder)"
      />

      {dashboard?.placeholderCad && (
        <p className="mb-4 text-xs text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)] p-3">
          CAD / body-cam integrations are not configured — using community reports and alerts feed.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active", value: dashboard?.activeIncidents ?? "—" },
          { label: "Unassigned", value: dashboard?.unassignedReports ?? "—" },
          { label: "Critical", value: dashboard?.criticalCount ?? "—" },
          { label: "Avg response (min)", value: dashboard?.avgResponseMin ?? "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Radio className="h-4 w-4" /> Dispatch feed
          </h2>
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {incidents.map((inc) => (
              <div
                key={`${inc.type}-${inc.id}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge>{inc.type}</Badge>
                  <Badge variant={inc.severity === "CRITICAL" ? "emergency" : "default"}>
                    {inc.severity}
                  </Badge>
                  <Badge variant="accent">{inc.status}</Badge>
                </div>
                <p className="mt-2 font-medium text-sm">{inc.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {inc.assignee ? `Assigned: ${inc.assignee}` : "Unassigned"} ·{" "}
                  {new Date(inc.createdAt).toLocaleString()}
                </p>
                {inc.type === "report" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => assign(inc.id)}>
                      Assign
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => escalate(inc.id)}>
                      Escalate
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {incidents.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">No active incidents</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Hotspots
          </h2>
          <MapPlaceholder label="Ops hotspot map" height="h-64" />
        </section>
      </div>
    </PageTransition>
  );
}
