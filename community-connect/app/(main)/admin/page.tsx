"use client";

import { useEffect, useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  mockAdminUsers,
  mockModerationQueue,
  mockAnalytics,
} from "@/lib/mock-data/admin";
import { Users, Flag, BarChart3, Map, Bell, FileWarning } from "lucide-react";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api/client";
import type { SafetyAlertDto, IncidentReportDto } from "@/types/safety";

interface SafetyAnalytics {
  activeAlerts: number;
  openReports: number;
  hotspots: { lat: number; lng: number; count: number; labels: string[] }[];
}

export default function AdminPage() {
  const [users] = useState(mockAdminUsers);
  const [queue, setQueue] = useState(mockModerationQueue);
  const [alerts, setAlerts] = useState<SafetyAlertDto[]>([]);
  const [reportQueue, setReportQueue] = useState<IncidentReportDto[]>([]);
  const [safetyStats, setSafetyStats] = useState<SafetyAnalytics | null>(null);
  const [newAlert, setNewAlert] = useState({ title: "", description: "", severity: "MODERATE" });

  useEffect(() => {
    void (async () => {
      try {
        const [a, r, s] = await Promise.all([
          apiFetch<{ items: SafetyAlertDto[] }>("/api/admin/alerts?limit=20"),
          apiFetch<{ items: IncidentReportDto[] }>("/api/admin/reports/queue"),
          apiFetch<SafetyAnalytics>("/api/admin/analytics/safety"),
        ]);
        setAlerts(a.items);
        setReportQueue(r.items);
        setSafetyStats(s);
      } catch {
        /* demo / unauthorized — keep mock stats */
      }
    })();
  }, []);

  const handleModerate = (id: string, action: "approve" | "dismiss") => {
    setQueue((q) =>
      q.map((item) =>
        item.id === id
          ? { ...item, status: action === "approve" ? "reviewed" : "dismissed" }
          : item
      )
    );
  };

  const publishAlert = async () => {
    try {
      const created = await apiFetch<SafetyAlertDto>("/api/admin/alerts", {
        method: "POST",
        body: JSON.stringify({
          title: newAlert.title,
          description: newAlert.description,
          severity: newAlert.severity,
          category: "COMMUNITY",
        }),
      });
      setAlerts((prev) => [created, ...prev]);
      setNewAlert({ title: "", description: "", severity: "MODERATE" });
    } catch {
      /* ignore in demo */
    }
  };

  const updateReportStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setReportQueue((q) => q.map((r) => (r.id === id ? { ...r, status: status as IncidentReportDto["status"] } : r)));
    } catch {
      /* ignore */
    }
  };

  const activeAlerts = safetyStats?.activeAlerts ?? mockAnalytics.alertsActive;

  return (
    <PageTransition>
      <PageHeader
        title="Admin Console"
        description="Safety operations, moderation, and platform analytics"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Users", value: mockAnalytics.totalUsers, icon: Users },
          { label: "Active Alerts", value: activeAlerts, icon: Bell },
          { label: "Open Reports", value: safetyStats?.openReports ?? 0, icon: FileWarning },
          { label: "Posts/Week", value: mockAnalytics.postsThisWeek, icon: BarChart3 },
          { label: "Events", value: mockAnalytics.eventsUpcoming, icon: BarChart3 },
          { label: "Listings", value: mockAnalytics.marketplaceListings, icon: BarChart3 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <stat.icon className="mb-2 h-4 w-4 text-[var(--muted-foreground)]" />
            <p className="text-2xl font-semibold">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="safety">
        <TabsList className="flex-wrap">
          <TabsTrigger value="safety">Safety Alerts</TabsTrigger>
          <TabsTrigger value="reports">Report Queue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="safety">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-3">
              <p className="font-medium">Publish alert</p>
              <Input
                placeholder="Title"
                value={newAlert.title}
                onChange={(e) => setNewAlert((s) => ({ ...s, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                rows={3}
                value={newAlert.description}
                onChange={(e) => setNewAlert((s) => ({ ...s, description: e.target.value }))}
              />
              <Button onClick={publishAlert} disabled={!newAlert.title || !newAlert.description}>
                Publish
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                  <div className="flex gap-2">
                    <Badge variant="emergency">{a.severity}</Badge>
                    {!a.active && <Badge>Expired</Badge>}
                  </div>
                  <p className="mt-1 font-medium">{a.title}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-3">
            {reportQueue.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Badge>{r.category}</Badge>
                  <p className="mt-1 font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{r.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateReportStatus(r.id, "UNDER_REVIEW")}>
                    Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, "RESOLVED")}>
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Reports</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === "active" ? "success" : "emergency"}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user.reports}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost">
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="moderation">
          <div className="space-y-3">
            {queue
              .filter((item) => item.status === "pending")
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{item.type}</Badge>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        by {item.reporter}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{item.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleModerate(item.id, "approve")}>
                      Review
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleModerate(item.id, "dismiss")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPlaceholder title="Reports by category" subtitle="Last 30 days" />
            <ChartPlaceholder title="Alerts by severity" subtitle="Last 30 days" />
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="font-medium">Safety hotspots</span>
              </div>
              <MapPlaceholder label="Safety heat map" height="h-64" />
              {safetyStats?.hotspots && safetyStats.hotspots.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {safetyStats.hotspots.map((h, i) => (
                    <li key={i} className="text-[var(--muted-foreground)]">
                      {h.count} reports near ({h.lat.toFixed(3)}, {h.lng.toFixed(3)}) — {h.labels.join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

function ChartPlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="font-medium">{title}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
      <div className="mt-4 flex items-end gap-1.5 h-32">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="flex-1 rounded-t-md bg-[var(--accent)]/60"
          />
        ))}
      </div>
    </div>
  );
}
