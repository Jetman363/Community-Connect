"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import {
  Activity,
  Database,
  HardDrive,
  Layers,
  RefreshCw,
  Server,
  Users,
  AlertTriangle,
  Gauge,
  Plug,
} from "lucide-react";

interface HealthChecks {
  database: { status: string; latencyMs?: number };
  cache: { status: string; backend: string; latencyMs?: number };
  queue: { status: string; backend: string; pending: number };
  socket: { status: string };
}

interface HealthResponse {
  status: string;
  uptimeSeconds: number;
  checks: HealthChecks;
}

interface MonitoringPayload {
  generatedAt: string;
  uptimeSeconds: number;
  activeUsers: number;
  sessionCount: number;
  systemHealth: Record<string, string>;
  integrations: {
    connectors: { id: string; name: string; slug: string; enabled: boolean; health?: string | null }[];
    syncLast24h: { status: string; _count: number }[];
  };
  recentErrors: { action: string; createdAt: string; actor?: { displayName: string } | null }[];
  pagePerformance: { p95Ms: number; avgMs: number; note: string };
}

const REFRESH_MS = 30_000;

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, m] = await Promise.all([
        fetch("/api/health").then((r) => r.json() as Promise<HealthResponse>),
        apiFetch<MonitoringPayload>("/api/admin/monitoring"),
      ]);
      setHealth(h);
      setMonitoring(m);
      setLastRefresh(new Date());
    } catch {
      setHealth(null);
      setMonitoring(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const errorRate =
    monitoring?.recentErrors.length != null
      ? `${monitoring.recentErrors.length} recent`
      : "—";

  return (
    <PageTransition>
      <PageHeader
        title="Website Monitoring"
        description="Real-time health, sessions, integrations, and error signals — refreshes every 30s"
        action={
          <div className="flex gap-2">
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                Admin Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {lastRefresh && (
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          Last updated {lastRefresh.toLocaleTimeString()} · Auto-refresh {REFRESH_MS / 1000}s
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={Activity}
          title="API"
          value={health?.status ?? "—"}
          detail={`Uptime ${formatUptime(health?.uptimeSeconds ?? monitoring?.uptimeSeconds)}`}
        />
        <StatusCard
          icon={Database}
          title="Database"
          value={health?.checks.database.status ?? monitoring?.systemHealth.database ?? "—"}
          detail={
            health?.checks.database.latencyMs != null
              ? `${health.checks.database.latencyMs}ms latency`
              : undefined
          }
        />
        <StatusCard
          icon={HardDrive}
          title="Cache"
          value={health?.checks.cache.status ?? monitoring?.systemHealth.cache ?? "—"}
          detail={health?.checks.cache.backend ?? monitoring?.systemHealth.redis}
        />
        <StatusCard
          icon={Layers}
          title="Queue"
          value={health?.checks.queue.status ?? "—"}
          detail={`${health?.checks.queue.pending ?? monitoring?.systemHealth.queuePending ?? 0} pending · ${health?.checks.queue.backend ?? monitoring?.systemHealth.queue ?? "—"}`}
        />
        <StatusCard
          icon={Server}
          title="Socket"
          value={health?.checks.socket.status ?? monitoring?.systemHealth.socket ?? "—"}
        />
        <StatusCard
          icon={Users}
          title="Active sessions"
          value={String(monitoring?.sessionCount ?? "—")}
          detail={`${monitoring?.activeUsers ?? "—"} registered users`}
        />
        <StatusCard
          icon={AlertTriangle}
          title="Error rate"
          value={errorRate}
          detail="From recent audit log actions"
        />
        <StatusCard
          icon={Gauge}
          title="Page perf (p95)"
          value={
            monitoring?.pagePerformance.p95Ms != null
              ? `${monitoring.pagePerformance.p95Ms}ms`
              : "—"
          }
          detail={monitoring?.pagePerformance.note}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plug className="h-4 w-4" /> Integration health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monitoring?.integrations.connectors.length ? (
              <ul className="space-y-2 text-sm">
                {monitoring.integrations.connectors.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <span>{c.name}</span>
                    <Badge variant={c.enabled ? "default" : "accent"}>
                      {c.health ?? (c.enabled ? "ok" : "disabled")}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                No connectors configured — check{" "}
                <Link href="/admin/integrations" className="text-[var(--accent)] hover:underline">
                  integrations
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent errors & denials</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
              {(monitoring?.recentErrors ?? []).map((entry, i) => (
                <li key={i} className="rounded-lg border border-[var(--border)] px-3 py-2">
                  <p className="font-medium">{entry.action}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(entry.createdAt).toLocaleString()} ·{" "}
                    {entry.actor?.displayName ?? "system"}
                  </p>
                </li>
              ))}
              {!monitoring?.recentErrors?.length && (
                <li className="text-[var(--muted-foreground)]">No error-like audit entries</li>
              )}
            </ul>
            <Link
              href="/admin"
              className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              View full audit log in admin console →
            </Link>
          </CardContent>
        </Card>
      </div>

      {monitoring?.systemHealth && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">System services</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(monitoring.systemHealth).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-[var(--border)] py-1">
                  <dt className="text-[var(--muted-foreground)]">{key}</dt>
                  <dd className="font-mono capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail?: string;
}) {
  const ok =
    value === "ok" ||
    value === "healthy" ||
    value === "configured" ||
    value === "memory" ||
    value === "memory-fallback" ||
    value === "default" ||
    /^\d+$/.test(value);
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <div className="rounded-lg bg-[var(--muted)] p-2">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-semibold capitalize">{value}</span>
            <Badge variant={ok ? "default" : "emergency"}>{ok ? "up" : "check"}</Badge>
          </div>
          {detail && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds?: number) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
