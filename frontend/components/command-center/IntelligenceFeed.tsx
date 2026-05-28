"use client";

import { PriorityBadge } from "@/components/ui/DataDisplay";
import type { IntelFeedItem } from "@/lib/command-center";
import { formatTime } from "@/lib/utils";
import { Brain, GitBranch, Link2, Search, Shield } from "lucide-react";

interface IntelligenceFeedProps {
  items: IntelFeedItem[];
  onSelectAlert?: (id: string) => void;
}

const CATEGORY_META: Record<
  IntelFeedItem["category"],
  { icon: typeof Brain; label: string; color: string }
> = {
  correlation: { icon: GitBranch, label: "Correlation", color: "text-purple-400" },
  osint: { icon: Search, label: "OSINT", color: "text-cyan-400" },
  pattern: { icon: Brain, label: "Pattern", color: "text-amber-400" },
  entity: { icon: Link2, label: "Entity Link", color: "text-emerald-400" },
  investigation: { icon: Shield, label: "Investigation", color: "text-blue-400" },
};

export function IntelligenceFeed({ items, onSelectAlert }: IntelligenceFeedProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Investigative Intelligence</span>
        </div>
        <span className="text-xs text-slate-500">{items.length} feeds</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No intelligence feeds</div>
        ) : (
          items.map((item) => {
            const meta = CATEGORY_META[item.category];
            const Icon = meta.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => item.id.includes("-") && onSelectAlert?.(item.id.split("-")[0])}
                className="w-full text-left px-4 py-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex gap-3">
                  <div className={`mt-0.5 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] uppercase tracking-wide ${meta.color}`}>{meta.label}</span>
                      <PriorityBadge priority={item.priority} />
                      {item.confidence != null && (
                        <span className="text-[10px] text-slate-600 tabular-nums">
                          {Math.round(item.confidence * 100)}% conf
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 font-medium line-clamp-1">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.detail}</p>
                    <span className="text-[10px] text-slate-600 tabular-nums mt-1 block">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
