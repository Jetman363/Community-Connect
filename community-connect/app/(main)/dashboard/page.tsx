"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Calendar, FileWarning, Store, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const quickLinks = [
  { href: "/alerts", label: "Safety Alerts", icon: Bell, count: 2 },
  { href: "/events", label: "Events", icon: Calendar, count: 5 },
  { href: "/report", label: "Report Issue", icon: FileWarning },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/hoa", label: "HOA", icon: Building2 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">Welcome back to your community hub</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item, i) => (
          <motion.div key={item.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={item.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 pt-5">
                  <div className="rounded-xl bg-[var(--accent)]/10 p-3">
                    <item.icon className="h-6 w-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    {item.count != null && (
                      <Badge variant="accent" className="mt-1">{item.count} active</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Posts this week", value: "47" },
              { label: "Open reports", value: "12" },
              { label: "RSVPs", value: "89" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-[var(--muted)] p-4 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
