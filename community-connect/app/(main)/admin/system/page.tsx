"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";
import { Activity, Database, HardDrive, Layers, RefreshCw, Server } from "lucide-react";

interface HealthResponse {
  status: string;
  uptimeSeconds: number;
  checks: {
    database: { status: string; latencyMs?: number };
    cache: { status: string; backend: string; latencyMs?: number };
    queue: { status: string; backend: string; pending: number };
    socket: { status: string };
  };
}

interface MetricsResponse {
  metrics: Record<string, number | string>;
  cache: { backend: string; ok: boolean };
  queue: { backend: string; pending: number; deadLetter: number };
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [h, m] = await Promise.all([
        fetch("/api/health").then((r) => r.json() as Promise<HealthResponse>),
        apiFetch<MetricsResponse>("/api/metrics").catch(() => null),
      ]);
      setHealth(h);
      setMetrics(m);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="System Operations"
        description="Health checks, cache, queue status, and observability placeholders"
        action={
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Console
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatusCard
          icon={Activity}
          title="Overall"
          value={health?.status ?? "—"}
          detail={`Uptime ${health?.uptimeSeconds ?? 0}s`}
        />
        <StatusCard
          icon={Database}
          title="Database"
          value={health?.checks.database.status ?? "—"}
          detail={
            health?.checks.database.latencyMs != null
              ? `${health.checks.database.latencyMs}ms`
              : undefined
          }
        />
        <StatusCard
          icon={HardDrive}
          title="Cache"
          value={health?.checks.cache.backend ?? "—"}
          detail={health?.checks.cache.status}
        />
        <StatusCard
          icon={Layers}
          title="Queue"
          value={health?.checks.queue.backend ?? "—"}
          detail={`${health?.checks.queue.pending ?? 0} pending`}
        />
        <StatusCard
          icon={Server}
          title="Socket"
          value={health?.checks.socket.status ?? "—"}
        />
        <StatusCard
          icon={Activity}
          title="Error rate"
          value="placeholder"
          detail="Wire to Sentry in Phase 9"
        />
      </div>

      {metrics && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Metrics snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(metrics.metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-[var(--border)] py-1">
                  <dt className="text-[var(--muted-foreground)]">{k}</dt>
                  <dd className="font-mono">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between border-b border-[var(--border)] py-1">
                <dt className="text-[var(--muted-foreground)]">dead_letter</dt>
                <dd className="font-mono">{metrics.queue.deadLetter}</dd>
              </div>
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
  const ok = value === "ok" || value === "healthy" || value === "memory" || value === "memory-fallback";
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
