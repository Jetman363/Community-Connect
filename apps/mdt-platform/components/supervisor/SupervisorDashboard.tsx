"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { AlertTriangle, MapPin, Shield } from "lucide-react";
import { TacticalMapLazy } from "@/components/map/TacticalMapLazy";
import { incidentsToMarkers, mergeMapMarkers, unitsToMarkers } from "@/lib/map-markers";
import { UnitStatusRollup } from "@/components/shared/UnitStatusRollup";
import type { Incident, Unit } from "@/lib/types";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { MessagingPanel } from "@/components/shared/MessagingPanel";
import type { DemoMessage, TimelineEntry } from "@/lib/types";

interface Props {
  incidents: Incident[];
  units: Unit[];
  timeline: TimelineEntry[];
  messages: DemoMessage[];
  onEscalate: (incidentId: string) => void;
  onSelectIncident: (inc: Incident) => void;
  selectedIncident: Incident | null;
}

export function SupervisorDashboard({
  incidents, units, timeline, messages, onEscalate, onSelectIncident, selectedIncident,
}: Props) {
  const active = incidents.filter((i) => i.status !== "closed");
  const emergencies = units.filter((u) => u.status === "emergency");
  const p1 = active.filter((i) => i.priority === "P1");

  const mapMarkers = useMemo(
    () => mergeMapMarkers(
      incidentsToMarkers(active, selectedIncident?.id),
      unitsToMarkers(units),
    ),
    [active, selectedIncident?.id, units],
  );

  return (
    <div className="grid grid-cols-12 gap-3 h-[calc(100vh-5rem)]">
      <div className="col-span-3 space-y-3 flex flex-col">
        <div className="tactical-panel p-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Force Overview
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <Stat label="Active Incidents" value={active.length} alert={active.length > 3} />
            <Stat label="P1 Critical" value={p1.length} alert={p1.length > 0} />
            <Stat label="Units Active" value={units.filter((u) => u.status !== "available" && u.status !== "clear").length} />
            <Stat label="Emergencies" value={emergencies.length} alert={emergencies.length > 0} />
          </div>
        </div>

        {emergencies.length > 0 && (
          <div className="tactical-panel p-3 bg-red-600/10 border-red-500/50 animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" /> OFFICER EMERGENCY
            </div>
            {emergencies.map((u) => (
              <p key={u.id} className="text-xs text-red-300 mt-1">Unit {u.call_sign} — EMERGENCY ACTIVE</p>
            ))}
          </div>
        )}

        <div className="tactical-panel flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-[#2a2a32] text-xs uppercase text-slate-500">Active Incidents</div>
          <div className="flex-1 overflow-y-auto p-2">
            {active.map((inc) => (
              <button
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={clsx(
                  "w-full text-left p-2 mb-1 rounded border text-xs",
                  selectedIncident?.id === inc.id ? "border-purple-500 bg-purple-600/10" : "border-[#2a2a32] bg-[#1a1a20]"
                )}
              >
                <span className={clsx("font-bold px-1 rounded", `priority-${inc.priority.toLowerCase()}`)}>{inc.priority}</span>
                <span className="font-mono text-slate-500 ml-1">{inc.incident_number}</span>
                <p className="text-slate-200 mt-0.5 truncate">{inc.nature}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-5 flex flex-col gap-3">
        <div className="tactical-panel flex-1 p-3">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Live Map — Unit Tracking
          </h3>
          <TacticalMapLazy
            markers={mapMarkers}
            fitToMarkers
            height={220}
            onMarkerClick={(m) => {
              if (m.kind === "incident") {
                const inc = incidents.find((i) => i.id === m.id);
                if (inc) onSelectIncident(inc);
              }
            }}
          />
          <p className="text-[10px] text-slate-600 mt-1">{units.length} units · {active.length} active incidents</p>

          {selectedIncident && (
            <div className="mt-3 space-y-2">
              <h4 className="font-semibold text-slate-200">{selectedIncident.nature}</h4>
              <p className="text-xs text-slate-400">{selectedIncident.location}</p>
              <div className="flex gap-2">
                <button onClick={() => onEscalate(selectedIncident.id)} className="tactical-btn bg-red-600/20 border border-red-500/50 text-red-300 text-xs">
                  Escalate Incident
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="tactical-panel h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-[#2a2a32] text-xs uppercase text-slate-500">Unit Status Board</div>
          <div className="flex-1 overflow-y-auto p-2">
            <UnitStatusRollup units={units} incidents={incidents} interactive={false} />
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col gap-3">
        <div className="tactical-panel flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-[#2a2a32] text-xs uppercase text-slate-500">Synchronized Timeline</div>
          <div className="flex-1 overflow-y-auto p-2">
            <IncidentTimeline entries={timeline} />
          </div>
        </div>
        <div className="h-64">
          <MessagingPanel messages={messages} incidentId={selectedIncident?.id} recipientRole="supervisor" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={clsx("p-2 rounded", alert ? "bg-red-600/10 border border-red-500/30" : "bg-[#1a1a20]")}>
      <div className={clsx("text-xl font-bold", alert ? "text-red-400" : "text-slate-200")}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
