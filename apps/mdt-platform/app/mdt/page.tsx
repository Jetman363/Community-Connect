"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PhoneIncoming } from "lucide-react";
import { MdtDashboard } from "@/components/mdt/MdtDashboard";
import { SupervisorModePanel } from "@/components/mdt/SupervisorModePanel";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { MultiScreenControls } from "@/components/shared/MultiScreenControls";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { canAccessReports } from "@/lib/permissions";
import { fetchIncidents, fetchUnits } from "@/lib/cad-api";
import { createCaseNumber, fetchPendingReports, officerStatusUpdate, submitPendingReport } from "@/lib/demo-api";
import {
  publishIncidentSelection,
  readIncidentSelection,
  subscribeIncidentSelection,
} from "@/lib/workspace-sync";
import type { Incident, OfficerStatusAction, PendingReport, Unit, UnitStatus, User } from "@/lib/types";

const ACTION_TO_CAD: Record<OfficerStatusAction, { status: UnitStatus; requireReport?: boolean }> = {
  en_route: { status: "en_route" },
  on_scene: { status: "on_scene" },
  transporting: { status: "transporting" },
  clear: { status: "clear" },
  out_of_service: { status: "out_of_service" },
  ten_eight: { status: "available", requireReport: false },
};

export default function MdtPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["officer"]} loginPath="/mdt/login" user={user}>
      {user && <MdtTerminal user={user} />}
    </ProgramGate>
  );
}

const MDT_WORKSPACE = "layout-mdt-workspace";

function MdtTerminal({ user }: { user: User }) {
  const { timeline, messages, incomingCall, refresh } = useDemo();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<OfficerStatusAction | null>(null);
  const [emergencySending, setEmergencySending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [submittingReportId, setSubmittingReportId] = useState<string | null>(null);
  const [creatingCase, setCreatingCase] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [incs, uns] = await Promise.all([fetchIncidents(), fetchUnits()]);
      setIncidents(incs.filter((i) => i.status !== "closed"));
      setUnits(uns);
      setLoadError(null);
      setSelected((prev) => {
        if (prev) {
          const updated = incs.find((i) => i.id === prev.id);
          if (updated && updated.status !== "closed") return updated;
        }
        const mine = incs.find((i) =>
          i.assignments?.some((a) => a.call_sign === user?.unitCallSign) &&
          !["closed", "pending_report"].includes(i.status),
        );
        return mine ?? incs.find((i) => i.status === "dispatched") ?? incs[0] ?? null;
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load CAD data");
      setIncidents(getDemoIncidents());
      setUnits(getDemoUnits());
      return;
    }

    if (user && canAccessReports(user.role)) {
      try {
        const reports = await fetchPendingReports(user.unitCallSign, user.id, user.role);
        setPendingReports(reports);
      } catch {
        setPendingReports([]);
      }
    } else {
      setPendingReports([]);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (timeline.length) load(); }, [timeline.length, load]);

  useEffect(() => {
    const saved = readIncidentSelection(MDT_WORKSPACE);
    if (saved && incidents.length) {
      const inc = incidents.find((i) => i.id === saved);
      if (inc) setSelected(inc);
    }
    return subscribeIncidentSelection(MDT_WORKSPACE, (incidentId) => {
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
    publishIncidentSelection(MDT_WORKSPACE, inc.id);
  }, []);

  const myUnit = units.find((u) => u.call_sign === user?.unitCallSign);

  const activeIncident =
    selected ??
    incidents.find(
      (i) =>
        i.assignments?.some((a) => a.call_sign === user?.unitCallSign) &&
        !["closed", "pending_report"].includes(i.status),
    ) ??
    null;

  const activeIncidentId = activeIncident?.id;

  const handleCreateCase = async () => {
    if (!activeIncidentId || !user?.unitCallSign) {
      setStatusError("Select an active call before creating a case number");
      return;
    }
    if (activeIncident?.case_number) {
      setStatusError("Case number already exists for this incident");
      return;
    }
    setCreatingCase(true);
    setStatusError(null);
    try {
      const result = await createCaseNumber({
        incident_id: activeIncidentId,
        actor_id: user.id,
        call_sign: user.unitCallSign,
        officer_name: user.name,
      });
      if (result.incident) {
        setSelected(result.incident);
      }
      await load();
      refresh();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to create case number");
    } finally {
      setCreatingCase(false);
    }
  };

  const handleStatus = async (action: OfficerStatusAction) => {
    if (!myUnit || !user?.unitCallSign) {
      setStatusError("No unit linked — verify unit selection at sign-in");
      return;
    }
    if (action === "ten_eight" && !activeIncidentId) {
      setStatusError("Select an active call before 10-8");
      return;
    }
    if (action === "ten_eight" && activeIncidentId) {
      const mandatoryPending = pendingReports.some((r) => r.incident_id === activeIncidentId);
      if (mandatoryPending) {
        setStatusError("Submit the mandatory case report before 10-8");
        return;
      }
    }
    const { status, requireReport } = ACTION_TO_CAD[action];
    setStatusUpdating(action);
    setStatusError(null);
    try {
      await officerStatusUpdate({
        call_sign: user.unitCallSign,
        status,
        incident_id: activeIncidentId,
        require_report: requireReport,
        actor_id: user.id,
        officer_name: user.name,
      });
      await load();
      refresh();
      if (action === "ten_eight") {
        setSelected(null);
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleSubmitReport = async (reportId: string, narrative: string) => {
    if (!user) return;
    setSubmittingReportId(reportId);
    try {
      await submitPendingReport(reportId, narrative, user.id);
      await load();
      refresh();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Report submission failed");
    } finally {
      setSubmittingReportId(null);
    }
  };

  const handleEmergency = async () => {
    if (!myUnit || !user?.unitCallSign) return;
    setEmergencySending(true);
    try {
      await officerStatusUpdate({
        call_sign: user.unitCallSign,
        status: "emergency",
        incident_id: activeIncidentId,
        actor_id: user.id,
        officer_name: user.name,
      });
      refresh();
      alert("SILENT EMERGENCY ACTIVATED");
    } catch { /* demo */ }
    finally { setEmergencySending(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-8">
      {incomingCall && (
        <div className="bg-green-600/20 border-b border-green-500/50 px-4 py-2 flex items-center gap-2 animate-pulse">
          <PhoneIncoming className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-300">Incoming 911 call simulation active</span>
        </div>
      )}
      {loadError && (
        <div className="bg-amber-600/10 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-300">
          CAD offline — using fallback data. Start docker compose for live updates.
        </div>
      )}
      <header className="border-b border-[#2a2a32] px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-slate-100">Officer MDT</span>
        <span className="font-mono text-slate-500">{user.unitCallSign ?? "NO UNIT"}</span>
        {user.serviceArea && (
          <span className="text-xs font-mono text-cyan-600/80 uppercase">{user.serviceArea}</span>
        )}
        {user.supervisorMode && (
          <span className="text-[10px] font-bold uppercase text-purple-400 border border-purple-500/40 px-1.5 rounded">Supervisor Mode</span>
        )}
        {myUnit && (
          <span className="text-xs font-mono text-slate-400 uppercase">
            Status: {myUnit.status.replace(/_/g, " ")}
          </span>
        )}
        <ConnectionStatus />
        <MultiScreenControls
          workspace={MDT_WORKSPACE}
          storageKey={MDT_WORKSPACE}
          popoutBasePath="/popout/mdt"
          panels={[
            { id: "call", title: "Call" },
            { id: "map", title: "Map" },
            { id: "tools", title: "Tools" },
            { id: "comms", title: "Comms" },
          ]}
          className="hidden lg:flex"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">{user.name}</span>
          <OperationsThemeToggle />
        </div>
      </header>
      <div className="p-1 md:p-2">
          {user.supervisorMode && (
            <SupervisorModePanel units={units} incidents={incidents} />
          )}
          <MdtDashboard
            incidents={incidents}
            selected={selected}
            onSelect={selectIncident}
            onStatusChange={handleStatus}
            onSilentEmergency={handleEmergency}
            onCreateCaseNumber={handleCreateCase}
            creatingCase={creatingCase}
            emergencySending={emergencySending}
            unitId={myUnit?.id}
            units={units}
            myCallSign={user.unitCallSign}
            myUnitStatus={myUnit?.status}
            connected={!!myUnit}
            statusUpdating={statusUpdating}
            statusError={statusError}
            pendingReports={pendingReports}
            onSubmitReport={canAccessReports(user.role) ? handleSubmitReport : undefined}
            submittingReportId={submittingReportId}
            showReports={canAccessReports(user.role)}
            timeline={timeline}
            messages={messages}
          />
        </div>
    </div>
  );
}

function getDemoIncidents(): Incident[] {
  return [{
    id: "demo-1", incident_number: "2026-000002", priority: "P2", nature: "Traffic stop — possible DWI",
    incident_type: "traffic", status: "dispatched", location: "Highway 281 near Evans Road",
    created_at: new Date().toISOString(), assignments: [{ call_sign: "1A12", unit_id: "u1" }],
  }];
}

function getDemoUnits(): Unit[] {
  return [{
    id: "demo-u1", call_sign: "1A12", unit_type: "patrol", status: "en_route",
    latitude: 29.4241, longitude: -98.4936,
  }];
}
