"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import {
  mockAdminUsers,
  mockModerationQueue,
  mockAnalytics,
} from "@/lib/mock-data/admin";
import {
  Users,
  Flag,
  BarChart3,
  Bell,
  Building2,
  Radio,
  ClipboardList,
  Activity,
  FileWarning,
  Shield,
} from "lucide-react";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { motion } from "framer-motion";
import Link from "next/link";
import type { SafetyAlertDto, IncidentReportDto } from "@/types/safety";

interface Overview {
  users?: number;
  communities?: number;
  activeAlerts?: number;
  openReports?: number;
  moderationQueue?: number;
  source?: string;
}

interface ModCase {
  id: string;
  entityType: string;
  status: string;
  aiConfidence?: number | null;
  reporter?: string;
}

export function EnterpriseConsole() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users] = useState(mockAdminUsers);
  const [queue, setQueue] = useState(mockModerationQueue);
  const [modCases, setModCases] = useState<ModCase[]>([]);
  const [alerts, setAlerts] = useState<SafetyAlertDto[]>([]);
  const [reportQueue, setReportQueue] = useState<IncidentReportDto[]>([]);
  const [auditItems, setAuditItems] = useState<{ action: string; createdAt: string; actor: { displayName: string } | null }[]>([]);
  const [health, setHealth] = useState<Record<string, string> | null>(null);
  const [broadcast, setBroadcast] = useState({ title: "", body: "", severity: "INFO" });
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [o, m, a, r, audit, h, comm] = await Promise.all([
          apiFetch<Overview>("/api/admin/overview"),
          apiFetch<{ cases: ModCase[] }>("/api/admin/moderation/queue"),
          apiFetch<{ items: SafetyAlertDto[] }>("/api/admin/alerts?limit=10"),
          apiFetch<{ items: IncidentReportDto[] }>("/api/admin/reports/queue"),
          apiFetch<{ items: { action: string; createdAt: string; actor: { displayName: string } | null }[] }>(
            "/api/admin/audit-logs?limit=20"
          ),
          apiFetch<Record<string, string>>("/api/admin/system-health"),
          apiFetch<{ items: { id: string; name: string }[] }>("/api/communities"),
        ]);
        setOverview(o);
        setModCases(m.cases ?? []);
        setAlerts(a.items);
        setReportQueue(r.items);
        setAuditItems(audit.items ?? []);
        setHealth(h);
        setCommunities(comm.items ?? []);
      } catch {
        setOverview({
          users: mockAnalytics.totalUsers,
          activeAlerts: mockAnalytics.alertsActive,
          moderationQueue: mockModerationQueue.length,
        });
      }
    })();
  }, []);

  const stats = [
    { label: "Users", value: overview?.users ?? mockAnalytics.totalUsers, icon: Users },
    { label: "Communities", value: overview?.communities ?? 1, icon: Building2 },
    { label: "Active Alerts", value: overview?.activeAlerts ?? mockAnalytics.alertsActive, icon: Bell },
    { label: "Open Reports", value: overview?.openReports ?? 0, icon: FileWarning },
    { label: "Mod Queue", value: overview?.moderationQueue ?? modCases.length, icon: Flag },
    { label: "Posts/Week", value: mockAnalytics.postsThisWeek, icon: BarChart3 },
  ];

  const sendBroadcast = async () => {
    try {
      const created = await apiFetch<{ id: string }>("/api/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify(broadcast),
      });
      await apiFetch(`/api/admin/broadcasts/${created.id}/send`, { method: "POST" });
      setBroadcast({ title: "", body: "", severity: "INFO" });
    } catch {
      /* demo */
    }
  };

  const resolveCase = async (id: string) => {
    try {
      await apiFetch(`/api/admin/moderation/cases/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      setModCases((c) => c.filter((x) => x.id !== id));
    } catch {
      setModCases((c) => c.filter((x) => x.id !== id));
    }
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <stat.icon className="mb-2 h-4 w-4 text-[var(--muted-foreground)]" />
            <p className="text-2xl font-semibold">{Number(stat.value).toLocaleString()}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="ops">
            <Link href="/admin/ops" className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Ops
            </Link>
          </TabsTrigger>
          <TabsTrigger value="hoa">
            <Link href="/hoa">HOA</Link>
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          <TabsTrigger value="health">System</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Enterprise control center — multi-community RBAC, workflows, and moderation.
            {overview?.source === "mock" && " (demo data)"}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <p className="font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Open moderation cases
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {modCases.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.entityType}</span>
                    {c.aiConfidence != null && (
                      <Badge variant="accent">AI {Math.round(c.aiConfidence * 100)}%</Badge>
                    )}
                  </li>
                ))}
                {modCases.length === 0 && (
                  <li className="text-[var(--muted-foreground)]">Queue clear</li>
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-4">
              <p className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent audit
              </p>
              <ul className="mt-3 space-y-1 text-xs text-[var(--muted-foreground)]">
                {auditItems.slice(0, 5).map((a, i) => (
                  <li key={i}>
                    {a.action} — {a.actor?.displayName ?? "system"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="communities">
          <div className="space-y-3">
            {communities.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] p-4"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-medium">{c.name}</span>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            ))}
            {communities.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">No communities loaded</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="moderation">
          <div className="space-y-3">
            {modCases.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Badge>{item.entityType}</Badge>
                  <Badge className="ml-2">{item.status}</Badge>
                  {item.aiConfidence != null && (
                    <Badge variant="accent" className="ml-2">
                      AI flagged
                    </Badge>
                  )}
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {item.reporter ? `Reported by ${item.reporter}` : "System"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => resolveCase(item.id)}>
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
            {modCases.length === 0 &&
              queue
                .filter((item) => item.status === "pending")
                .map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4 text-sm">
                    {item.content}
                  </div>
                ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsPanel />
        </TabsContent>

        <TabsContent value="audit">
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-[var(--muted)] border-b">
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Actor</th>
                </tr>
              </thead>
              <tbody>
                {auditItems.map((a, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="px-4 py-2 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">{a.action}</td>
                    <td className="px-4 py-2">{a.actor?.displayName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a
            href="/api/admin/audit-logs/export"
            className="mt-4 inline-flex text-sm text-[var(--accent)] hover:underline"
          >
            Export audit CSV
          </a>
        </TabsContent>

        <TabsContent value="broadcasts">
          <div className="max-w-lg space-y-3 rounded-2xl border border-[var(--border)] p-4">
            <p className="font-medium flex items-center gap-2">
              <Radio className="h-4 w-4" /> Broadcast composer
            </p>
            <Input
              placeholder="Title"
              value={broadcast.title}
              onChange={(e) => setBroadcast((s) => ({ ...s, title: e.target.value }))}
            />
            <Textarea
              placeholder="Message"
              rows={4}
              value={broadcast.body}
              onChange={(e) => setBroadcast((s) => ({ ...s, body: e.target.value }))}
            />
            <Button onClick={sendBroadcast} disabled={!broadcast.title || !broadcast.body}>
              Send broadcast
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            <Link href="/admin/system" className="text-[var(--accent)] font-medium">
              Open full system operations dashboard →
            </Link>
          </p>
          <dl className="grid gap-2 text-sm max-w-md">
            {health &&
              Object.entries(health).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-[var(--border)] py-2">
                  <dt className="text-[var(--muted-foreground)]">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </TabsContent>

        <TabsContent value="safety">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-xl border p-3 text-sm">
                <Badge variant="emergency">{a.severity}</Badge>
                <p className="mt-1 font-medium">{a.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {reportQueue.slice(0, 5).map((r) => (
              <div key={r.id} className="text-sm border rounded-xl p-3">
                {r.title} — {r.status}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ops">
          <p className="text-sm">
            Open the{" "}
            <Link href="/admin/ops" className="text-[var(--accent)] font-medium">
              Public Safety Ops panel
            </Link>{" "}
            for dispatch feed and incident assignment.
          </p>
        </TabsContent>

        <TabsContent value="hoa">
          <p className="text-sm">
            Manage HOA at{" "}
            <Link href="/hoa" className="text-[var(--accent)] font-medium">
              /hoa
            </Link>
          </p>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AnalyticsPanel() {
  const [type, setType] = useState("engagement");
  const [data, setData] = useState<{ series?: { date: string; posts?: number }[] } | null>(null);

  useEffect(() => {
    void apiFetch<{ series?: { date: string; posts?: number }[] }>(`/api/admin/analytics/${type}`)
      .then(setData)
      .catch(() => setData(null));
  }, [type]);

  const bars = data?.series?.map((s) => s.posts ?? 10) ?? [40, 65, 45, 80, 55, 90];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["engagement", "safety", "marketplace", "growth", "moderation"].map((t) => (
          <Button
            key={t}
            size="sm"
            variant={type === t ? "default" : "outline"}
            onClick={() => setType(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <p className="font-medium capitalize">{type} analytics</p>
        <div className="mt-4 flex items-end gap-1.5 h-32">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(h, 100)}%` }}
              className="flex-1 rounded-t-md bg-[var(--accent)]/60"
            />
          ))}
        </div>
      </div>
      <MapPlaceholder label="Heat map placeholder" height="h-48" />
    </div>
  );
}
