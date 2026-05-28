"use client";

import { PriorityBadge } from "@/components/ui/DataDisplay";
import type { LiveAlert } from "@/lib/alerts-api";
import { threatScoreBarColor, threatScoreColor } from "@/lib/command-center";
import { formatTime } from "@/lib/utils";
import { Brain, TrendingUp } from "lucide-react";

interface ThreatScorePanelProps {
  alerts: LiveAlert[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function ThreatScorePanel({ alerts, selectedId, onSelect }: ThreatScorePanelProps) {
  const ranked = [...alerts].sort((a, b) => b.threatScore - a.threatScore).slice(0, 8);
  const avg = ranked.length
    ? Math.round(ranked.reduce((s, a) => s + a.threatScore, 0) / ranked.length)
    : 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">AI Threat Scoring</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <TrendingUp className="w-3 h-3" />
          Avg {avg}
        </div>
      </div>

      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={avg >= 85 ? "#ef4444" : avg >= 65 ? "#f59e0b" : "#06b6d4"}
                strokeWidth="3"
                strokeDasharray={`${(avg / 100) * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-bold tabular-nums ${threatScoreColor(avg)}`}>{avg}</span>
              <span className="text-[9px] text-slate-500 uppercase">Score</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 leading-relaxed">
            Real-time threat prioritization from multi-source correlation, BOLO matches, officer safety signals, and
            configurable rule engine hits.
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {ranked.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No scored alerts</div>
        ) : (
          ranked.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelect?.(alert.id)}
              className={`w-full text-left px-4 py-3 hover:bg-slate-800/30 transition-colors ${
                selectedId === alert.id ? "bg-cyan-500/5 border-l-2 border-cyan-500" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <PriorityBadge priority={alert.priority} />
                <span className={`text-sm font-semibold tabular-nums ${threatScoreColor(alert.threatScore)}`}>
                  {Math.round(alert.threatScore)}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2 mb-2">{alert.message}</p>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all ${threatScoreBarColor(alert.threatScore)}`}
                  style={{ width: `${Math.min(100, alert.threatScore)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>{alert.sourceSystem}</span>
                <span className="tabular-nums">{formatTime(alert.timestamp)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
