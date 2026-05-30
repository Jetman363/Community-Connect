"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import type { LaunchMetrics } from "@/types/launch-metrics";
import { Activity, Bot, Store, Bell, Users, Heart } from "lucide-react";

export default function LaunchCommandCenterPage() {
  const [metrics, setMetrics] = useState<LaunchMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<LaunchMetrics>("/api/admin/launch-metrics")
      .then(setMetrics)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <PageHeader
        title="Launch Command Center"
        description="Executive view — DAU, marketplace, alerts, AI usage, and system health"
        action={
          <Link href="/admin" className="text-sm text-[var(--accent)] hover:underline">
            ← Admin
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Updated {new Date(metrics.generatedAt).toLocaleString()} · Source: {metrics.source}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard icon={Users} label="DAU (est.)" value={metrics.dau} />
            <MetricCard icon={Store} label="Active listings" value={metrics.marketplaceListings} />
            <MetricCard icon={Activity} label="Marketplace inquiries" value={metrics.marketplaceInquiries} />
            <MetricCard icon={Heart} label="Events this week" value={metrics.eventsThisWeek} />
            <MetricCard icon={Bell} label="Active alerts" value={metrics.activeAlerts} />
            <MetricCard icon={Bot} label="AI sessions (24h)" value={metrics.aiChatSessions24h} />
          </div>
          <Card className="mt-6 glass-panel">
            <CardHeader>
              <CardTitle>Engagement & health</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Feed posts (24h)</p>
                <p className="text-2xl font-semibold">{metrics.feedPosts24h}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Engagement score</p>
                <p className="text-2xl font-semibold">{metrics.engagementScore}/100</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">System health</p>
                <p className="text-2xl font-semibold capitalize">{metrics.systemHealth}</p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">Unable to load metrics — admin access required.</p>
      )}
    </PageTransition>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="glass-panel">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-xl bg-[var(--accent)]/10 p-3">
          <Icon className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
