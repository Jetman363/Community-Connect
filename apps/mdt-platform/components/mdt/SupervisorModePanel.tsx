"use client";

import { UnitStatusRollup } from "@/components/shared/UnitStatusRollup";
import type { Incident, Unit } from "@/lib/types";

/** Read-only force view for officers with supervisorMode permission. */
export function SupervisorModePanel({ units, incidents }: { units: Unit[]; incidents: Incident[] }) {
  return (
    <div className="tactical-panel p-3 mb-3 border-purple-500/30">
      <p className="text-[10px] uppercase text-purple-400 mb-2 font-semibold">Supervisor Mode — Force View</p>
      <UnitStatusRollup units={units} incidents={incidents} interactive={false} />
    </div>
  );
}
