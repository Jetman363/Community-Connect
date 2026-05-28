"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { AlertTriangle, Shield } from "lucide-react";
import type { Incident, Unit, UnitStatus } from "@/lib/types";
import { isOfficerAssignableUnit, isSupervisorUnit } from "@/lib/permissions";

export type DispatcherStatusAction =
  | "en_route"
  | "on_scene"
  | "transporting"
  | "clear"
  | "available"
  | "out_of_service";

const ON_CALL_ACTIONS: { action: DispatcherStatusAction; label: string }[] = [
  { action: "en_route", label: "En Route" },
  { action: "on_scene", label: "On Scene" },
  { action: "transporting", label: "Transport" },
  { action: "clear", label: "Clear" },
];

const OFF_CALL_ACTIONS: { action: DispatcherStatusAction; label: string; release?: boolean }[] = [
  { action: "available", label: "Available", release: true },
  { action: "out_of_service", label: "Out of Svc", release: true },
];

interface Props {
  units: Unit[];
  incidents: Incident[];
  interactive?: boolean;
  updatingUnitId?: string | null;
  onStatusChange?: (unit: Unit, action: DispatcherStatusAction, releaseFromCall: boolean) => void;
}

export function UnitStatusRollup({
  units,
  incidents,
  interactive = false,
  updatingUnitId,
  onStatusChange,
}: Props) {
  const active = incidents.filter((i) => i.status !== "closed");
  const emergencies = units.filter((u) => u.status === "emergency");
  const p1 = active.filter((i) => i.priority === "P1");
  const busyCount = units.filter(
    (u) => u.status !== "available" && u.status !== "clear" && u.status !== "out_of_service",
  ).length;

  const grouped = useMemo(() => {
    const officers = units.filter((u) => isOfficerAssignableUnit(u.unit_type) && !isSupervisorUnit(u.unit_type));
    const supervisors = units.filter((u) => isSupervisorUnit(u.unit_type));
    const support = units.filter((u) => !isOfficerAssignableUnit(u.unit_type));
    return { officers, supervisors, support };
  }, [units]);

  const incidentForUnit = (callSign: string) =>
    incidents.find(
      (i) =>
        i.assignments?.some((a) => a.call_sign === callSign) &&
        !["closed", "pending_report"].includes(i.status),
    );

  return (
    <div className="space-y-3">
      <div className="tactical-panel p-3">
        <h3 className="mdt-read-label mb-3 flex items-center gap-1.5">
          <Shield className="h-4 w-4" /> Force Roll-Up
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Active" value={active.length} alert={active.length > 3} />
          <Stat label="P1" value={p1.length} alert={p1.length > 0} />
          <Stat label="On Call" value={busyCount} />
          <Stat label="Emergency" value={emergencies.length} alert={emergencies.length > 0} />
        </div>
      </div>

      {emergencies.length > 0 && (
        <div className="tactical-panel border-red-500/50 bg-red-600/10 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <AlertTriangle className="h-5 w-5" /> Officer Emergency
          </div>
          {emergencies.map((u) => (
            <p key={u.id} className="mt-1 font-mono text-sm text-red-300">
              Unit {u.call_sign}
            </p>
          ))}
        </div>
      )}

      <UnitGroup
        title="Officers"
        units={grouped.officers}
        interactive={interactive}
        updatingUnitId={updatingUnitId}
        incidentForUnit={incidentForUnit}
        onStatusChange={onStatusChange}
      />
      <UnitGroup
        title="Supervisors"
        units={grouped.supervisors}
        interactive={interactive}
        updatingUnitId={updatingUnitId}
        incidentForUnit={incidentForUnit}
        onStatusChange={onStatusChange}
      />
      {grouped.support.length > 0 && (
        <UnitGroup
          title="Support"
          units={grouped.support}
          interactive={interactive}
          updatingUnitId={updatingUnitId}
          incidentForUnit={incidentForUnit}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}

function UnitGroup({
  title,
  units,
  interactive,
  updatingUnitId,
  incidentForUnit,
  onStatusChange,
}: {
  title: string;
  units: Unit[];
  interactive: boolean;
  updatingUnitId?: string | null;
  incidentForUnit: (callSign: string) => Incident | undefined;
  onStatusChange?: (unit: Unit, action: DispatcherStatusAction, releaseFromCall: boolean) => void;
}) {
  if (!units.length) return null;

  return (
    <div className="tactical-panel overflow-hidden">
      <div className="border-b border-[#2a2a32] p-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto p-2">
        {units.map((u) => {
          const inc = incidentForUnit(u.call_sign);
          const onCall = !!inc || !["available", "clear", "out_of_service"].includes(u.status);
          return (
            <div key={u.id} className={clsx("rounded-xl border p-3", statusColor(u.status))}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-base font-bold text-slate-100">{u.call_sign}</div>
                  <div className="mt-0.5 truncate text-sm capitalize opacity-90">
                    {u.officer_names?.join(", ") ?? u.unit_type.replace(/_/g, " ")}
                  </div>
                  <div className="mt-0.5 text-xs font-mono uppercase text-slate-500">
                    {u.status.replace(/_/g, " ")}
                  </div>
                  {inc && (
                    <div className="mt-1.5 truncate text-sm text-blue-300">
                      {inc.incident_number} — {inc.nature}
                    </div>
                  )}
                </div>
                {onCall && (
                  <span className="shrink-0 text-xs font-bold uppercase text-amber-400">On Call</span>
                )}
              </div>
              {interactive && onStatusChange && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ON_CALL_ACTIONS.map(({ action, label }) => (
                    <StatusBtn
                      key={action}
                      label={label}
                      disabled={updatingUnitId === u.id}
                      onClick={() => onStatusChange(u, action, false)}
                    />
                  ))}
                  {OFF_CALL_ACTIONS.map(({ action, label, release }) => (
                    <StatusBtn
                      key={action}
                      label={label}
                      variant="off"
                      disabled={updatingUnitId === u.id}
                      onClick={() => onStatusChange(u, action, !!release)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBtn({
  label,
  onClick,
  disabled,
  variant = "on",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "on" | "off";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "dispatch-status-btn",
        variant === "on"
          ? "border-blue-500/40 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25"
          : "border-slate-500/40 bg-slate-600/15 text-slate-300 hover:bg-slate-600/25",
      )}
    >
      {label}
    </button>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-lg p-2",
        alert ? "border border-red-500/30 bg-red-600/10" : "bg-[#1a1a20]",
      )}
    >
      <div className={clsx("text-xl font-bold", alert ? "text-red-400" : "text-slate-100")}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function statusColor(status: UnitStatus | string) {
  if (status === "emergency") return "status-emergency border-red-500/40";
  if (status === "available" || status === "clear") return "status-available border-green-500/20";
  if (status === "out_of_service") return "border-slate-600/40 bg-slate-800/40";
  return "status-busy border-amber-500/20";
}

export function filterAssignableUnits(units: Unit[]): Unit[] {
  return units.filter(
    (u) => isOfficerAssignableUnit(u.unit_type) && (u.status === "available" || u.status === "clear"),
  );
}
