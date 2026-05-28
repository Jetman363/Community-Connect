"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { MdtDashboard } from "@/components/mdt/MdtDashboard";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { canAccessReports } from "@/lib/permissions";
import { fetchIncidents, fetchUnits } from "@/lib/cad-api";
import { fetchPendingReports } from "@/lib/demo-api";
import { unregisterPopout, registerPopout } from "@/lib/panel-popout-store";
import {
  publishIncidentSelection,
  readIncidentSelection,
  subscribeIncidentSelection,
} from "@/lib/workspace-sync";
import type { Incident, PendingReport, Unit, User } from "@/lib/types";

const WORKSPACE = "layout-mdt-workspace";

function MdtPopoutInner() {
  const searchParams = useSearchParams();
  const panelId = searchParams.get("panel") ?? "map";
  const workspace = searchParams.get("workspace") ?? WORKSPACE;
  const { user } = useAuth();
  const { timeline, messages, refresh } = useDemo();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [incs, uns] = await Promise.all([fetchIncidents(), fetchUnits()]);
      setIncidents(incs.filter((i) => i.status !== "closed"));
      setUnits(uns);
      setSelected((prev) => {
        const savedId = readIncidentSelection(workspace);
        const targetId = prev?.id ?? savedId;
        if (targetId) {
          const inc = incs.find((i) => i.id === targetId);
          if (inc && inc.status !== "closed") return inc;
        }
        const mine = incs.find((i) =>
          i.assignments?.some((a) => a.call_sign === user.unitCallSign) &&
          !["closed", "pending_report"].includes(i.status),
        );
        return mine ?? prev;
      });
      if (canAccessReports(user.role)) {
        try {
          const reports = await fetchPendingReports(user.unitCallSign, user.id, user.role);
          setPendingReports(reports);
        } catch {
          setPendingReports([]);
        }
      }
    } catch {
      /* demo */
    }
  }, [user, workspace]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
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
  }, [workspace]);

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

  if (!user) return null;

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#0c0c0e]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#2a2a32] px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">MDT Popout</span>
        <ConnectionStatus />
        {user.unitCallSign && (
          <span className="font-mono text-xs text-blue-400">{user.unitCallSign}</span>
        )}
        {selected && (
          <span className="truncate font-mono text-xs text-slate-400">{selected.incident_number}</span>
        )}
      </header>
      <div className="min-h-0 flex-1 p-2">
        <MdtDashboard
          incidents={incidents}
          selected={selected}
          onSelect={handleSelect}
          onStatusChange={() => undefined}
          onSilentEmergency={() => undefined}
          units={units}
          myCallSign={user.unitCallSign}
          connected
          pendingReports={pendingReports}
          timeline={timeline}
          messages={messages}
          showReports={canAccessReports(user.role)}
          soloWorkspacePanelId={panelId}
        />
      </div>
    </div>
  );
}

export default function MdtPopoutPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["officer"]} loginPath="/mdt/login" user={user}>
      <Suspense fallback={<div className="p-4 text-slate-500">Loading panel…</div>}>
        {user && <MdtPopoutInner />}
      </Suspense>
    </ProgramGate>
  );
}
