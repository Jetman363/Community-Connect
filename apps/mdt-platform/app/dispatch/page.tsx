"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { DispatchConsole } from "@/components/dispatch/DispatchConsole";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { MessagingPanel } from "@/components/shared/MessagingPanel";
import { ResizablePanelLayout } from "@/components/shared/ResizablePanelLayout";
import { MultiScreenControls } from "@/components/shared/MultiScreenControls";
import type { DispatcherStatusAction } from "@/components/shared/UnitStatusRollup";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { assignUnit, fetchIncidents, fetchUnits, getUnitRecommendations } from "@/lib/cad-api";
import { dispatcherUnitStatusUpdate } from "@/lib/demo-api";
import {
  publishIncidentSelection,
  readIncidentSelection,
  subscribeIncidentSelection,
} from "@/lib/workspace-sync";
import type { Incident, Unit, User } from "@/lib/types";

export default function DispatchPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["dispatcher"]} loginPath="/dispatch/login" user={user}>
      {user && <DispatchTerminal user={user} />}
    </ProgramGate>
  );
}

const DISPATCH_WORKSPACE = "layout-dispatch-console";

function DispatchTerminal({ user }: { user: User }) {
  const { timeline, messages, refresh } = useDemo();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [recommendations, setRecommendations] = useState<{ unit_id: string; call_sign: string; score: number; reason: string }[]>([]);
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [incs, uns] = await Promise.all([fetchIncidents(), fetchUnits()]);
      setIncidents(incs);
      setUnits(uns);
    } catch { /* demo fallback */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { refresh(); }, [refresh, timeline.length]);

  useEffect(() => {
    const saved = readIncidentSelection(DISPATCH_WORKSPACE);
    if (saved && incidents.length) {
      const inc = incidents.find((i) => i.id === saved);
      if (inc) setSelected(inc);
    }
    return subscribeIncidentSelection(DISPATCH_WORKSPACE, (incidentId) => {
      if (!incidentId) {
        setSelected(null);
        return;
      }
      const inc = incidents.find((i) => i.id === incidentId);
      if (inc) setSelected(inc);
    });
  }, [incidents]);

  const selectIncident = useCallback((inc: Incident) => {
    setSelected(inc);
    publishIncidentSelection(DISPATCH_WORKSPACE, inc.id);
  }, []);

  useEffect(() => {
    if (!selected) { setRecommendations([]); return; }
    getUnitRecommendations(selected.id).then(setRecommendations).catch(() => setRecommendations([]));
  }, [selected]);

  const handleUnitStatus = useCallback(async (unit: Unit, action: DispatcherStatusAction, releaseFromCall: boolean) => {
    const inc = incidents.find((i) =>
      i.assignments?.some((a) => a.call_sign === unit.call_sign) &&
      !["closed", "pending_report"].includes(i.status),
    );
    const incidentId = inc?.id ?? selected?.id;
    if (!releaseFromCall && ["en_route", "on_scene", "transporting", "clear"].includes(action) && !incidentId) {
      setStatusError(`Select an incident or assign ${unit.call_sign} before setting on-call status`);
      return;
    }
    setUpdatingUnitId(unit.id);
    setStatusError(null);
    try {
      await dispatcherUnitStatusUpdate({
        call_sign: unit.call_sign,
        status: action,
        incident_id: releaseFromCall ? inc?.id : incidentId,
        release_from_call: releaseFromCall,
        actor_id: user.id,
        dispatcher_name: user.name,
      });
      await load();
      refresh();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setUpdatingUnitId(null);
    }
  }, [incidents, selected, user.id, user.name, load, refresh]);

  const handleAssign = useCallback(async (incidentId: string, unitId: string) => {
    try {
      await assignUnit(incidentId, unitId);
      await load();
      refresh();
      const inc = incidents.find((i) => i.id === incidentId);
      if (inc) selectIncident(inc);
    } catch { /* demo */ }
  }, [load, refresh, incidents, selectIncident]);

  const bottomPanels = useMemo(
    () => [
      {
        id: "timeline",
        title: "Event Timeline",
        defaultWeight: 1,
        minWidth: 240,
        content: <IncidentTimeline entries={timeline} />,
      },
      {
        id: "messaging",
        title: "Unit Messaging",
        defaultWeight: 1.2,
        minWidth: 280,
        fillHeight: true,
        noPadding: true,
        content: (
          <div className="h-full min-h-0 p-2">
            <MessagingPanel messages={messages} incidentId={selected?.id} recipientRole="officer" />
          </div>
        ),
      },
    ],
    [timeline, messages, selected?.id],
  );

  const pagePanels = useMemo(
    () => [
      {
        id: "console",
        title: "Dispatch Console",
        defaultWeight: 3.5,
        minHeight: 320,
        fillHeight: true,
        noPadding: true,
        content: (
          <DispatchConsole
            incidents={incidents}
            units={units}
            selectedIncident={selected}
            onSelectIncident={selectIncident}
            onAssignUnit={handleAssign}
            onUnitStatusChange={handleUnitStatus}
            updatingUnitId={updatingUnitId}
            recommendations={recommendations}
          />
        ),
      },
      {
        id: "auxiliary",
        title: "Timeline & Messaging",
        defaultWeight: 1,
        minHeight: 160,
        fillHeight: true,
        noPadding: true,
        content: (
          <ResizablePanelLayout
            storageKey="layout-dispatch-page-bottom"
            panels={bottomPanels}
            height="100%"
            className="h-full min-h-0"
          />
        ),
      },
    ],
    [
      incidents,
      units,
      selected,
      handleAssign,
      handleUnitStatus,
      updatingUnitId,
      recommendations,
      bottomPanels,
    ],
  );

  const pageHeight = selected ? "calc(100dvh - 8.5rem)" : "calc(100dvh - 7rem)";

  return (
    <div className="min-h-screen pt-8">
      <header className="border-b border-[#2a2a32] px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-slate-100">CAD Dispatch Console</span>
        <ConnectionStatus />
        <MultiScreenControls
          workspace={DISPATCH_WORKSPACE}
          storageKey={DISPATCH_WORKSPACE}
          popoutBasePath="/popout/dispatch"
          panels={[
            { id: "pending", title: "Incoming" },
            { id: "active", title: "Active" },
            { id: "units", title: "Units" },
            { id: "map", title: "Map" },
            { id: "rollup", title: "Roll-Up" },
          ]}
          className="hidden md:flex"
        />
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          {user.serviceArea && (
            <span className="font-mono text-cyan-600/80 uppercase">{user.serviceArea}</span>
          )}
          <span>{user.name}</span>
          <OperationsThemeToggle />
        </div>
      </header>
      {statusError && (
        <div className="border-b border-red-500/30 bg-red-600/10 px-4 py-2 text-sm text-red-300">{statusError}</div>
      )}
      {selected && (
        <div className="flex shrink-0 items-center gap-3 border-b border-[#2a2a32] bg-[#121218] px-4 py-2">
          <span
            className={clsx(
              "rounded-lg border px-2 py-0.5 text-xs font-bold",
              `priority-${selected.priority.toLowerCase()}`,
            )}
          >
            {selected.priority}
          </span>
          <span className="font-mono text-sm text-slate-400">{selected.incident_number}</span>
          <span className="truncate text-base font-semibold text-slate-100">{selected.nature}</span>
          {selected.location && (
            <span className="ml-auto hidden truncate text-sm text-slate-500 md:inline">{selected.location}</span>
          )}
        </div>
      )}
      <div className="p-2 md:p-3" style={{ height: pageHeight }}>
        <ResizablePanelLayout
          storageKey="layout-dispatch-page"
          direction="vertical"
          panels={pagePanels}
          height="100%"
          className="min-h-0"
        />
      </div>
    </div>
  );
}
