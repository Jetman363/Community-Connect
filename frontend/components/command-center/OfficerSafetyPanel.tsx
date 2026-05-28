"use client";

import { PriorityBadge } from "@/components/ui/DataDisplay";
import type { LiveAlert } from "@/lib/alerts-api";
import { formatTime } from "@/lib/utils";
import { AlertOctagon, ShieldAlert } from "lucide-react";

interface OfficerSafetyPanelProps {
  alerts: LiveAlert[];
  onSelect?: (id: string) => void;
}

export function OfficerSafetyPanel({ alerts, onSelect }: OfficerSafetyPanelProps) {
  const safetyAlerts = alerts.filter(
    (a) => a.officerSafety || a.type.toLowerCase().includes("officer") || a.priority === "critical"
  );

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header bg-red-950/20 border-red-900/30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-white">Officer Safety</span>
          {safetyAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold animate-pulse">
              {safetyAlerts.length} ACTIVE
            </span>
          )}
        </div>
      </div>

      {safetyAlerts.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <ShieldAlert className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
          <p className="text-sm text-emerald-400/80">All clear — no officer safety alerts</p>
        </div>
      ) : (
        <div className="divide-y divide-red-900/20">
          {safetyAlerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelect?.(alert.id)}
              className="w-full text-left px-4 py-3 bg-red-500/5 hover:bg-red-500/10 transition-colors border-l-2 border-red-500"
            >
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PriorityBadge priority={alert.priority} />
                    {alert.escalated && (
                      <span className="text-[10px] text-amber-400 uppercase tracking-wide">Escalated</span>
                    )}
                  </div>
                  <p className="text-sm text-red-100 font-medium">{alert.message}</p>
                  <div className="flex gap-3 mt-1.5 text-[10px] text-red-300/60">
                    <span>{alert.sourceSystem}</span>
                    <span className="tabular-nums">{formatTime(alert.timestamp)}</span>
                    <span>Threat {Math.round(alert.threatScore)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
