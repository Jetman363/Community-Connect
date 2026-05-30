"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { Plug, RefreshCw } from "lucide-react";

interface ConnectorRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  enabled: boolean;
  health?: { status: string; lastCheck: string } | null;
}

export default function IntegrationsPage() {
  const [connectors, setConnectors] = useState<ConnectorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ items: ConnectorRow[] }>("/api/admin/integrations/connectors");
      setConnectors(res.items);
    } catch {
      setConnectors([
        { id: "demo-1", slug: "mock-cad", name: "Mock CAD", category: "PUBLIC_SAFETY", enabled: false },
        { id: "demo-2", slug: "mock-rms", name: "Mock RMS", category: "PUBLIC_SAFETY", enabled: false },
        { id: "demo-3", slug: "mock-traffic", name: "Mock Traffic", category: "SMART_CITY", enabled: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = async (id: string, enable: boolean) => {
    try {
      await apiFetch("/api/admin/integrations/connectors", {
        method: "PATCH",
        body: JSON.stringify({ id, action: enable ? "enable" : "disable" }),
      });
      void load();
    } catch {
      setConnectors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: enable } : c))
      );
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Integration Connectors"
        description="Config-driven connector management — enable adapters per tenant, manage credentials and health"
      />

      <div className="mb-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href="/admin/integrations/monitor">Monitoring</a>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading connectors…</p>
      ) : (
        <div className="space-y-3">
          {connectors.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="flex items-start gap-3">
                <Plug className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{c.slug}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge>{c.category}</Badge>
                    {c.health && <Badge variant="accent">{c.health.status}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {c.enabled ? (
                  <Button size="sm" variant="outline" onClick={() => void toggle(c.id, false)}>
                    Disable
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void toggle(c.id, true)}>
                    Enable
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
