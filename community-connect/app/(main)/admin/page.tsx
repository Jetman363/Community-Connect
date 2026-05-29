"use client";

import { useState } from "react";
import { PageTransition, PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mockAdminUsers,
  mockModerationQueue,
  mockAnalytics,
} from "@/lib/mock-data/admin";
import { Users, Flag, BarChart3, Map } from "lucide-react";
import { MapPlaceholder } from "@/components/ui/map-placeholder";
import { motion } from "framer-motion";

export default function AdminPage() {
  const [users] = useState(mockAdminUsers);
  const [queue, setQueue] = useState(mockModerationQueue);

  const handleModerate = (id: string, action: "approve" | "dismiss") => {
    setQueue((q) =>
      q.map((item) =>
        item.id === id
          ? { ...item, status: action === "approve" ? "reviewed" : "dismissed" }
          : item
      )
    );
  };

  return (
    <PageTransition>
      <PageHeader
        title="Admin Console"
        description="User management, moderation, and platform analytics"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Users", value: mockAnalytics.totalUsers, icon: Users },
          { label: "Active Today", value: mockAnalytics.activeToday, icon: Users },
          { label: "Posts/Week", value: mockAnalytics.postsThisWeek, icon: BarChart3 },
          { label: "Active Alerts", value: mockAnalytics.alertsActive, icon: Flag },
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

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

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
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Reason: {item.reason}
                    </p>
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
            <ChartPlaceholder title="User Growth" subtitle="Last 30 days" />
            <ChartPlaceholder title="Engagement" subtitle="Posts, comments, RSVPs" />
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span className="font-medium">Activity Heat Map</span>
              </div>
              <MapPlaceholder label="Activity heat map" height="h-64" />
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
