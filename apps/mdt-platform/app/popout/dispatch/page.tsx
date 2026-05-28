"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { DispatchConsole } from "@/components/dispatch/DispatchConsole";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import type { DispatcherStatusAction } from "@/components/shared/UnitStatusRollup";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { assignUnit, fetchIncidents, fetchUnits, getUnitRecommendations } from "@/lib/cad-api";
import { dispatcherUnitStatusUpdate } from "@/lib/demo-api";
import { unregisterPopout, registerPopout } from "@/lib/panel-popout-store";
import {
  publishIncidentSelection,
  readIncidentSelection,
  subscribeIncidentSelection,
} from "@/lib/workspace-sync";
import type { Incident, Unit } from "@/lib/types";

const WORKSPACE = "layout-dispatch-console";

function DispatchPopoutInner() {
  const searchParams = useSearchParams();
  const panelId = searchParams.get("panel") ?? "map";
  const workspace = searchParams.get("workspace") ?? WORKSPACE;
  const { user } = useAuth();
  const { refresh } = useDemo();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [recommendations, setRecommendations] = useState<
    { unit_id: string; call_sign: string; score: number; reason: string }[]
  >([]);
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [incs, uns] = await Promise.all([fetchIncidents(), fetchUnits()]);
      setIncidents(incs);
      setUnits(uns);
      setSelected((prev) => {
        const savedId = readIncidentSelection(workspace);
        const targetId = prev?.id ?? savedId;
        if (targetId) {
          const inc = incs.find((i) => i.id === targetId);
          if (inc) return inc;
        }
        return prev;
      });
    } catch {
      /* demo fallback */
    }
  }, [workspace]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const saved = readIncidentSelection(workspace);
    if (saved && incidents.length) {
      const inc = incidents.find((i) => i.id === saved);
      if (inc) setSelected(inc);
    }
    return subscribeIncidentSelection(workspace, (incidentId) => {
      if (!incidentId) {
        setSelected(null);
        return;
      }
      setIncidents((incs) => {
        const inc = incs.find((i) => i.id === incidentId);
        if (inc) setSelected(inc);
        return incs;
      });
    });
  }, [workspace, incidents.length]);

  useEffect(() => {
    if (!selected) {
      setRecommendations([]);
      return;
    }
    getUnitRecommendations(selected.id).then(setRecommendations).catch(() => setRecommendations([]));
  }, [selected]);

  useEffect(() => {
    registerPopout({
      workspace,
      panelId,
      title: panelId,
      openedAt: Date.now(),
    });
    const handler = () => unregisterPopout(workspace, panelId);
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      handler();
      window.removeEventListener("beforeunload", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [workspace, panelId]);

  const handleSelect = useCallback(
    (inc: Incident) => {
      setSelected(inc);
      publishIncidentSelection(workspace, inc.id);
    },
    [workspace],
  );

  const handleAssign = useCallback(
    async (incidentId: string, unitId: string) => {
      try {
        await assignUnit(incidentId, unitId);
        await load();
        refresh();
        const inc = incidents.find((i) => i.id === incidentId);
        if (inc) handleSelect(inc);
      } catch {
        /* demo */
      }
    },
    [load, refresh, incidents, handleSelect],
  );

  const handleUnitStatus = useCallback(
    async (unit: Unit, action: DispatcherStatusAction, releaseFromCall: boolean) => {
      if (!user) return;
      setUpdatingUnitId(unit.id);
      try {
        await dispatcherUnitStatusUpdate({
          call_sign: unit.call_sign,
          status: action,
          incident_id: releaseFromCall ? undefined : selected?.id,
          release_from_call: releaseFromCall,
          actor_id: user.id,
          dispatcher_name: user.name,
        });
        await load();
        refresh();
      } finally {
        setUpdatingUnitId(null);
      }
    },
    [user, selected?.id, load, refresh],
  );

  if (!user) return null;

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#0c0c0e]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#2a2a32] px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Dispatch Popout</span>
        <ConnectionStatus />
        {selected && (
          <>
            <span
              className={clsx(
                "rounded border px-1.5 py-0.5 text-[10px] font-bold",
                `priority-${selected.priority.toLowerCase()}`,
              )}
            >
              {selected.priority}
            </span>
            <span className="truncate font-mono text-xs text-slate-400">{selected.incident_number}</span>
          </>
        )}
      </header>
      <div className="min-h-0 flex-1 p-2">
        <DispatchConsole
          incidents={incidents}
          units={units}
          selectedIncident={selected}
          onSelectIncident={handleSelect}
          onAssignUnit={handleAssign}
          onUnitStatusChange={handleUnitStatus}
          updatingUnitId={updatingUnitId}
          recommendations={recommendations}
          soloPanelId={panelId}
        />
      </div>
    </div>
  );
}

export default function DispatchPopoutPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["dispatcher"]} loginPath="/dispatch/login" user={user}>
      <Suspense fallback={<div className="p-4 text-slate-500">Loading panel…</div>}>
        {user && <DispatchPopoutInner />}
      </Suspense>
    </ProgramGate>
  );
}
