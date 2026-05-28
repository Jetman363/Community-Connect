"use client";

import { AlertTriangle, RefreshCw, ShieldAlert, Wifi, WifiOff } from "lucide-react";
import { PriorityBadge } from "@/components/ui/DataDisplay";
import { acknowledgeAlert, ingestDemoAlert, type LiveAlert } from "@/lib/alerts-api";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LiveAlertsPanelProps {
  alerts: LiveAlert[];
  connected: boolean;
  loading?: boolean;
  usingMock?: boolean;
  error?: string | null;
  token?: string | null;
  agencyId?: string;
  onRefresh?: () => void;
  compact?: boolean;
}

export function LiveAlertsPanel({
  alerts,
  connected,
  loading,
  usingMock,
  error,
  token,
  agencyId,
  onRefresh,
  compact = false,
}: LiveAlertsPanelProps) {
  const handleAck = async (alertId: string) => {
    if (!token) return;
    try {
      await acknowledgeAlert(token, alertId);
      onRefresh?.();
    } catch {
      // silent — audit logged server-side
    }
  };

  const handleDemoIngest = async () => {
    if (!token || !agencyId) return;
    try {
      await ingestDemoAlert(token, agencyId);
      onRefresh?.();
    } catch {
      // ignore
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Live Alerts</span>
          {connected ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <Wifi className="w-3 h-3" /> WS
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <WifiOff className="w-3 h-3" /> offline
            </span>
          )}
          {usingMock && (
            <span className="text-[10px] text-amber-500/80 border border-amber-500/20 px-1.5 py-0.5 rounded">demo data</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {token && agencyId && (
            <button
              onClick={handleDemoIngest}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 px-2 py-1 border border-cyan-500/20 rounded"
            >
              + Test Alert
            </button>
          )}
          {onRefresh && (
            <button onClick={onRefresh} className="text-slate-400 hover:text-slate-200 p-1" title="Refresh">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/5 border-b border-amber-500/10">{error}</div>
      )}

      <div className="divide-y divide-slate-800/50 max-h-[420px] overflow-y-auto">
        {loading && alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">No active alerts</div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "px-4 py-3 hover:bg-slate-800/20 transition-colors",
                alert.officerSafety && "bg-red-500/5 border-l-2 border-red-500"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={alert.priority} />
                  <span className="text-xs font-medium text-slate-400">{alert.type}</span>
                  {alert.officerSafety && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400">
                      <ShieldAlert className="w-3 h-3" /> Officer Safety
                    </span>
                  )}
                </div>
                {!compact && token && alert.status === "active" && (
                  <button
                    onClick={() => handleAck(alert.id)}
                    className="text-[10px] text-slate-500 hover:text-cyan-400 shrink-0"
                  >
                    ACK
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-300">{alert.message}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                <span className="tabular-nums">{formatTime(alert.timestamp)}</span>
                <span>{alert.sourceSystem}</span>
                <span>Score {Math.round(alert.threatScore)}</span>
                {alert.escalated && <span className="text-amber-500">Escalated</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
