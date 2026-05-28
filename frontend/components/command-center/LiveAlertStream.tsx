"use client";

import { PriorityBadge } from "@/components/ui/DataDisplay";
import type { LiveAlert } from "@/lib/alerts-api";
import { formatTime } from "@/lib/utils";
import { Activity, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface LiveAlertStreamProps {
  alerts: LiveAlert[];
  connected: boolean;
  loading: boolean;
  usingMock: boolean;
  error: string | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onRefresh?: () => void;
}

export function LiveAlertStream({
  alerts,
  connected,
  loading,
  usingMock,
  error,
  selectedId,
  onSelect,
  onRefresh,
}: LiveAlertStreamProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-white">Live Alert Stream</span>
          {connected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Wifi className="w-3 h-3" /> LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <WifiOff className="w-3 h-3" /> {usingMock ? "DEMO" : "OFFLINE"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Refresh alerts"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            {loading ? "Loading alerts…" : "No active alerts"}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => onSelect?.(alert.id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-800/30 transition-colors ${
                  selectedId === alert.id ? "bg-cyan-500/5 border-l-2 border-cyan-500" : ""
                } ${alert.officerSafety ? "bg-red-500/5" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{alert.type}</span>
                  <PriorityBadge priority={alert.priority} />
                </div>
                <p className="text-sm text-slate-200 line-clamp-2">{alert.message}</p>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                  <span>{alert.sourceSystem}</span>
                  <span className="tabular-nums">{formatTime(alert.timestamp)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
