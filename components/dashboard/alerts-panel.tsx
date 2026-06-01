"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { AlertCard } from "@/components/cards/alert-card";
import { mockAlerts } from "@/lib/mock-data";

export function AlertsPanel() {
  const alerts = mockAlerts.filter((a) => a.active).slice(0, 3);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Safety Alerts</h2>
        <Link
          href="/alerts"
          className="flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <AlertCard alert={alert} compact />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
