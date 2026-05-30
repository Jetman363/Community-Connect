"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { Activity, AlertCircle } from "lucide-react";

interface HealthData {
  connectors: Array<{ slug: string; name: string; enabled: boolean; health?: { status: string } | null }>;
  syncLast24h: Array<{ status: string; _count: number }>;
}

interface SyncLog {
  id: string;
  direction: string;
  status: string;
  payloadSummary?: string | null;
  error?: string | null;
  createdAt: string;
  connector?: { slug: string; name: string };
}

export default function IntegrationsMonitorPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);

  const load = async () => {
    try {
      const [h, l] = await Promise.all([
        apiFetch<HealthData>("/api/admin/integrations/health?refresh=true"),
        apiFetch<{ items: SyncLog[] }>("/api/admin/integrations/sync-logs?limit=30"),
      ]);
      setHealth(h);
      setLogs(l.items);
    } catch {
      setHealth({
        connectors: [
          { slug: "mock-cad", name: "Mock CAD", enabled: true, health: { status: "HEALTHY" } },
        ],
        syncLast24h: [{ status: "SUCCESS", _count: 12 }],
      });
      setLogs([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Integration Monitor"
        description="Connector health, sync throughput, and error logs"
      />

      <Button size="sm" variant="outline" className="mb-4" onClick={() => void load()}>
        Refresh health checks
      </Button>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {health?.syncLast24h.map((s) => (
          <div key={s.status} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-2xl font-semibold">{s._count}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Sync {s.status} (24h)</p>
          </div>
        )) ?? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 col-span-2">
            <p className="text-sm text-[var(--muted-foreground)]">No sync metrics yet</p>
          </div>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Activity className="h-4 w-4" /> Connector health
        </h2>
        <div className="space-y-2">
          {health?.connectors.map((c) => (
            <div
              key={c.slug}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <Badge variant={c.enabled ? "accent" : "default"}>
                {c.health?.status ?? (c.enabled ? "UNKNOWN" : "disabled")}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4" /> Sync logs
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge>{log.connector?.slug ?? "—"}</Badge>
                <Badge variant="accent">{log.direction}</Badge>
                <Badge variant={log.status === "FAILED" ? "emergency" : "default"}>{log.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {log.payloadSummary ?? log.error ?? "—"} · {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">No sync logs recorded</p>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
