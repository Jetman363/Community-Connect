"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Clock, MapPin, Phone, Users } from "lucide-react";
import { TacticalMapLazy } from "@/components/map/TacticalMapLazy";
import { ResizablePanelLayout } from "@/components/shared/ResizablePanelLayout";
import { filterAssignableUnits, UnitStatusRollup, type DispatcherStatusAction } from "@/components/shared/UnitStatusRollup";
import { incidentsToMarkers, mergeMapMarkers, unitsToMarkers } from "@/lib/map-markers";
import { getUnitDragId, setUnitDragData, unitDropHandlers, UNIT_DRAG_MIME } from "@/lib/unit-drag";
import type { Incident, Unit } from "@/lib/types";

interface Props {
  incidents: Incident[];
  units: Unit[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onAssignUnit: (incidentId: string, unitId: string) => void;
  onUnitStatusChange?: (unit: Unit, action: DispatcherStatusAction, releaseFromCall: boolean) => void;
  updatingUnitId?: string | null;
  recommendations: { unit_id: string; call_sign: string; score: number; reason: string }[];
  /** When set, render only this panel (used by popout windows) */
  soloPanelId?: string;
}

export function DispatchConsole({
  incidents,
  units,
  selectedIncident,
  onSelectIncident,
  onAssignUnit,
  onUnitStatusChange,
  updatingUnitId,
  recommendations,
  soloPanelId,
}: Props) {
  const pending = incidents.filter((i) => i.status === "pending");
  const active = incidents.filter((i) => i.status !== "pending" && i.status !== "closed");
  const available = filterAssignableUnits(units);

  const mapMarkers = useMemo(
    () =>
      mergeMapMarkers(
        incidentsToMarkers(incidents, selectedIncident?.id),
        unitsToMarkers(units),
      ),
    [incidents, selectedIncident?.id, units],
  );

  const panels = useMemo(
    () => [
      {
        id: "pending",
        title: "Incoming",
        count: pending.length,
        defaultWeight: 1,
        minWidth: 200,
        content: (
          <div className="space-y-2">
            {pending.map((inc) => (
              <IncidentCard
                key={inc.id}
                inc={inc}
                selected={selectedIncident?.id === inc.id}
                onClick={() => onSelectIncident(inc)}
                onDropUnit={(unitId) => onAssignUnit(inc.id, unitId)}
              />
            ))}
            {pending.length === 0 && <Empty>No pending calls</Empty>}
          </div>
        ),
      },
      {
        id: "active",
        title: "Active",
        count: active.length,
        defaultWeight: 1,
        minWidth: 200,
        content: (
          <div className="space-y-2">
            {active.length === 0 ? (
              <Empty>No active incidents</Empty>
            ) : (
              active.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  inc={inc}
                  selected={selectedIncident?.id === inc.id}
                  onClick={() => onSelectIncident(inc)}
                  onDropUnit={(unitId) => onAssignUnit(inc.id, unitId)}
                />
              ))
            )}
          </div>
        ),
      },
      {
        id: "units",
        title: "Units",
        count: available.length,
        defaultWeight: 1,
        minWidth: 180,
        content: (
          <div>
            <p className="mb-2 px-1 text-xs text-slate-500">
              Drag a unit onto any call card to assign
            </p>
            {available.map((u) => (
              <UnitChip key={u.id} unit={u} />
            ))}
            {available.length === 0 && <Empty>No units available</Empty>}
          </div>
        ),
      },
      {
        id: "map",
        title: "Map",
        defaultWeight: 2.2,
        minWidth: 280,
        fillHeight: true,
        noPadding: true,
        content: (
          <div
            className="flex h-full min-h-0 flex-col gap-3 p-2"
            {...(selectedIncident
              ? unitDropHandlers((unitId) => onAssignUnit(selectedIncident.id, unitId))
              : {})}
          >
            <TacticalMapLazy
              markers={mapMarkers}
              fitToMarkers
              height={280}
              className="shrink-0"
              onMarkerClick={(m) => {
                if (m.kind === "incident") {
                  const inc = incidents.find((i) => i.id === m.id);
                  if (inc) onSelectIncident(inc);
                }
              }}
            />
            {selectedIncident ? (
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                <SelectedIncidentDetail
                  incident={selectedIncident}
                  onDropUnit={(unitId) => onAssignUnit(selectedIncident.id, unitId)}
                />
                {recommendations.length > 0 && (
                  <div>
                    <p className="mdt-read-label mb-2">Recommended Units</p>
                    <div className="space-y-2">
                      {recommendations.map((r) => (
                        <button
                          key={r.unit_id}
                          type="button"
                          onClick={() => onAssignUnit(selectedIncident.id, r.unit_id)}
                          className="w-full rounded-xl border border-blue-500/40 bg-blue-600/10 p-3 text-left transition-colors hover:bg-blue-600/20 touch-manipulation"
                        >
                          <span className="font-mono text-base font-bold text-blue-300">{r.call_sign}</span>
                          <span className="ml-2 text-sm text-slate-400">Score {r.score}</span>
                          <p className="mt-1 text-sm text-slate-500">{r.reason}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-slate-500">
                <MapPin className="h-10 w-10 opacity-30" />
                <p className="text-base">Select an incident from the queue or map</p>
                <p className="text-sm text-slate-600">Drop a unit on a call card to assign</p>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "rollup",
        title: "Roll-Up",
        defaultWeight: 1.1,
        minWidth: 220,
        content: (
          <UnitStatusRollup
            units={units}
            incidents={incidents}
            interactive
            updatingUnitId={updatingUnitId}
            onStatusChange={onUnitStatusChange}
          />
        ),
      },
    ],
    [
      pending,
      active,
      available,
      selectedIncident,
      mapMarkers,
      incidents,
      recommendations,
      units,
      updatingUnitId,
      onSelectIncident,
      onAssignUnit,
      onUnitStatusChange,
    ],
  );

  if (soloPanelId) {
    const panel = panels.find((p) => p.id === soloPanelId);
    if (!panel) {
      return <p className="p-4 text-slate-500">Unknown panel: {soloPanelId}</p>;
    }
    return (
      <div className="tactical-panel flex h-full min-h-0 flex-col overflow-hidden">
        <div className="border-b border-[#2a2a32] bg-[#141418] px-3 py-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">{panel.title}</h2>
        </div>
        <div
          className={clsx(
            "min-h-0 flex-1",
            !panel.noPadding && "p-2",
            panel.fillHeight ? "flex flex-col overflow-hidden" : "overflow-y-auto",
          )}
        >
          {panel.content}
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelLayout
      storageKey="layout-dispatch-console"
      panels={panels}
      height="100%"
      className="tactical-panel h-full min-h-0 overflow-hidden"
      popout={{ workspace: "layout-dispatch-console", basePath: "/popout/dispatch" }}
    />
  );
}

function UnitChip({ unit }: { unit: Unit }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setUnitDragData(e.dataTransfer, unit.id, unit.call_sign);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={clsx("dispatch-unit-chip", dragging && "dispatch-unit-chip--dragging")}
    >
      <div className="font-mono text-base font-bold text-slate-100">{unit.call_sign}</div>
      <div className="mt-0.5 text-sm capitalize text-slate-400">
        {unit.unit_type.replace(/_/g, " ")}
      </div>
      {unit.officer_names?.[0] && (
        <div className="mt-1 text-sm text-slate-500">{unit.officer_names[0]}</div>
      )}
    </div>
  );
}

function SelectedIncidentDetail({
  incident,
  onDropUnit,
}: {
  incident: Incident;
  onDropUnit: (unitId: string) => void;
}) {
  const [dropTarget, setDropTarget] = useState(false);
  const drop = unitDropHandlers((unitId) => {
    onDropUnit(unitId);
    setDropTarget(false);
  });

  return (
    <div
      className={clsx("space-y-3 rounded-xl transition-colors", dropTarget && "ring-2 ring-green-500/50")}
      onDragOver={(e) => {
        drop.onDragOver(e);
        setDropTarget(true);
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(e) => {
        drop.onDrop(e);
        setDropTarget(false);
      }}
    >
      <div className="mdt-read-pane border border-[#2a2a32]">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "rounded-lg border px-2.5 py-1 text-sm font-bold",
              `priority-${incident.priority.toLowerCase()}`,
            )}
          >
            {incident.priority}
          </span>
          <span className="font-mono text-base text-slate-300">{incident.incident_number}</span>
          {incident.case_number && (
            <span className="font-mono text-sm text-amber-400">{incident.case_number}</span>
          )}
          <span className="ml-auto text-xs font-mono uppercase text-slate-500">
            {incident.status.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug text-slate-100">{incident.nature}</h3>
        <p className="mt-2 flex items-start gap-2 text-base text-slate-300">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          {incident.location ?? "No location"}
        </p>
        {incident.cross_streets && (
          <p className="mt-1 text-sm text-slate-500">Cross: {incident.cross_streets}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {incident.caller_name && (
          <DetailChip label="Caller" value={incident.caller_name} />
        )}
        {incident.caller_phone && (
          <DetailChip label="Phone" value={incident.caller_phone} icon={<Phone className="h-4 w-4" />} />
        )}
        {incident.incident_type && (
          <DetailChip label="Type" value={incident.incident_type} />
        )}
      </div>

      {incident.notes && (
        <div>
          <p className="mdt-read-label">Dispatch Notes</p>
          <div className="mdt-read-pane text-sm leading-relaxed">{incident.notes}</div>
        </div>
      )}

      {incident.assignments && incident.assignments.length > 0 && (
        <div>
          <p className="mdt-read-label mb-1.5">Assigned Units</p>
          <div className="flex flex-wrap gap-2">
            {incident.assignments.map((a, i) => (
              <span
                key={i}
                className="rounded-lg bg-blue-600/20 px-3 py-1.5 font-mono text-sm font-semibold text-blue-300"
              >
                {a.call_sign ?? a.unit_id.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-green-500/80">Drop a unit here to assign to this incident</p>
    </div>
  );
}

function DetailChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mdt-read-pane py-2.5">
      <p className="mdt-read-label text-[10px]">{label}</p>
      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
        {icon}
        {value}
      </p>
    </div>
  );
}

function IncidentCard({
  inc,
  selected,
  onClick,
  onDropUnit,
}: {
  inc: Incident;
  selected: boolean;
  onClick: () => void;
  onDropUnit: (unitId: string) => void;
}) {
  const [dropTarget, setDropTarget] = useState(false);

  return (
    <div
      className={clsx(
        "dispatch-incident-card",
        selected && "dispatch-incident-card--selected",
        dropTarget && "dispatch-incident-card--drop-target",
      )}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(UNIT_DRAG_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropTarget(true);
        }
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(e) => {
        e.preventDefault();
        const unitId = getUnitDragId(e.dataTransfer);
        if (unitId) onDropUnit(unitId);
        setDropTarget(false);
      }}
    >
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className={clsx(
              "rounded-lg border px-2 py-0.5 text-xs font-bold",
              `priority-${inc.priority.toLowerCase()}`,
            )}
          >
            {inc.priority}
          </span>
          <span className="font-mono text-sm text-slate-400">{inc.incident_number}</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono uppercase text-slate-600">
            <Clock className="h-3.5 w-3.5" />
            {inc.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-base font-semibold leading-snug text-slate-100">{inc.nature}</p>
        {inc.location && (
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-blue-400/80" />
            {inc.location}
          </p>
        )}
        {inc.assignments && inc.assignments.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="font-mono text-sm text-slate-400">
              {inc.assignments.map((a) => a.call_sign).filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </button>
      {dropTarget && (
        <p className="mt-2 text-center text-xs font-semibold text-green-400">Release to assign unit</p>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-500">{children}</p>;
}
