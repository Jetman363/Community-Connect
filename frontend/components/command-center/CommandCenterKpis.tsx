"use client";

import { KpiCard } from "@/components/ui/DataDisplay";
import type { CommandCenterStats } from "@/lib/command-center";

interface CommandCenterKpisProps {
  stats: CommandCenterStats;
}

export function CommandCenterKpis({ stats }: CommandCenterKpisProps) {
  const kpis = [
    {
      label: "Active Alerts",
      value: stats.activeAlerts,
      change: stats.criticalAlerts > 0 ? stats.criticalAlerts * 5 : 0,
      trend: stats.criticalAlerts > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      label: "Critical",
      value: stats.criticalAlerts,
      change: stats.criticalAlerts,
      trend: stats.criticalAlerts > 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Officer Safety",
      value: stats.officerSafety,
      change: stats.officerSafety * 10,
      trend: stats.officerSafety > 0 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Avg Threat Score",
      value: stats.avgThreatScore,
      change: stats.avgThreatScore > 70 ? 8 : -5,
      trend: stats.avgThreatScore > 70 ? ("up" as const) : ("down" as const),
    },
    {
      label: "Geolocated",
      value: stats.geolocatedEvents,
      change: 12,
      trend: "up" as const,
    },
    {
      label: "Intel Feeds",
      value: stats.intelItems,
      change: 3,
      trend: "up" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
