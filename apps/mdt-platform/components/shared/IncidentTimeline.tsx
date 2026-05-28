"use client";

import clsx from "clsx";
import { Clock } from "lucide-react";
import type { TimelineEntry } from "@/lib/types";

const EVENT_COLORS: Record<string, string> = {
  new_call_created: "border-l-blue-500",
  cad_event_created: "border-l-cyan-500",
  unit_assigned: "border-l-green-500",
  officer_enroute: "border-l-yellow-500",
  officer_onscene: "border-l-orange-500",
  incident_escalated: "border-l-red-500",
  officer_request_backup: "border-l-red-600",
  supervisor_note_added: "border-l-purple-500",
  report_started: "border-l-indigo-500",
  report_required: "border-l-amber-500",
  report_completed: "border-l-teal-500",
  message_sent: "border-l-slate-500",
  scenario_started: "border-l-pink-500",
};

export function IncidentTimeline({ entries, limit = 50 }: { entries: TimelineEntry[]; limit?: number }) {
  const seen = new Set<string>();
  const items = entries.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  }).slice(0, limit);
  if (!items.length) return <p className="text-xs text-slate-600 text-center py-4">No timeline events yet</p>;

  return (
    <div className="space-y-1">
      {items.map((e) => (
        <div key={e.id} className={clsx("pl-3 border-l-2 py-1.5", EVENT_COLORS[e.event_type] ?? "border-l-slate-600")}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-slate-500">{e.event_type.replace(/_/g, " ")}</span>
            <span className="text-[10px] text-slate-600 flex items-center gap-0.5 ml-auto">
              <Clock className="w-2.5 h-2.5" />
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-slate-300">{e.description}</p>
          <p className="text-[10px] text-slate-600">{e.actor_role} · {e.actor_id}</p>
        </div>
      ))}
    </div>
  );
}
