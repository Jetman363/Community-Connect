"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Car,
  ClipboardList,
  FilePlus,
  MapPin,
  Navigation,
  ShieldAlert,
  User,
  Wrench,
} from "lucide-react";
import clsx from "clsx";
import { TacticalMapLazy } from "@/components/map/TacticalMapLazy";
import { NcicLookupModal } from "@/components/mdt/NcicLookupModal";
import { ReportWritingPanel } from "@/components/mdt/ReportWritingPanel";
import { MessagingPanel } from "@/components/shared/MessagingPanel";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { PanelBody, ResizablePanelLayout, type LayoutPanel } from "@/components/shared/ResizablePanelLayout";
import { incidentsToMarkers, mergeMapMarkers, unitsToMarkers } from "@/lib/map-markers";
import type {
  DemoMessage,
  Incident,
  NcicQueryResult,
  OfficerStatusAction,
  PendingReport,
  TimelineEntry,
  Unit,
  UnitStatus,
} from "@/lib/types";

const STATUS_BUTTONS: {
  action: OfficerStatusAction;
  label: string;
  shortLabel: string;
  color: string;
  activeStatus?: UnitStatus;
}[] = [
  { action: "en_route", label: "En Route", shortLabel: "En Rt", color: "bg-blue-600 hover:bg-blue-500", activeStatus: "en_route" },
  { action: "on_scene", label: "On Scene", shortLabel: "Scene", color: "bg-amber-600 hover:bg-amber-500", activeStatus: "on_scene" },
  { action: "transporting", label: "Transport", shortLabel: "Trans", color: "bg-purple-600 hover:bg-purple-500", activeStatus: "transporting" },
  { action: "clear", label: "Clear", shortLabel: "Clear", color: "bg-green-600 hover:bg-green-500", activeStatus: "clear" },
  { action: "out_of_service", label: "Out of Svc", shortLabel: "OOS", color: "bg-slate-600 hover:bg-slate-500", activeStatus: "out_of_service" },
  { action: "ten_eight", label: "10-8", shortLabel: "10-8", color: "bg-teal-700 hover:bg-teal-600", activeStatus: "available" },
];

function isAssignedToUnit(inc: Incident, callSign?: string) {
  return !!callSign && inc.assignments?.some((a) => a.call_sign === callSign);
}

interface Props {
  incidents: Incident[];
  selected: Incident | null;
  onSelect: (inc: Incident) => void;
  onStatusChange: (action: OfficerStatusAction) => void;
  onSilentEmergency: () => void;
  unitId?: string;
  units?: Unit[];
  myCallSign?: string;
  myUnitStatus?: UnitStatus;
  connected: boolean;
  statusUpdating?: OfficerStatusAction | null;
  statusError?: string | null;
  emergencySending?: boolean;
  onCreateCaseNumber?: () => void;
  creatingCase?: boolean;
  onNcicResult?: (result: NcicQueryResult) => void;
  pendingReports?: PendingReport[];
  onSubmitReport?: (reportId: string, narrative: string) => Promise<void>;
  submittingReportId?: string | null;
  timeline?: TimelineEntry[];
  messages?: DemoMessage[];
  showReports?: boolean;
  /** Render only one workspace panel fullscreen (popout windows) */
  soloWorkspacePanelId?: string;
}

export function MdtDashboard({
  incidents,
  selected,
  onSelect,
  onStatusChange,
  onSilentEmergency,
  units = [],
  myCallSign,
  myUnitStatus,
  connected,
  statusUpdating,
  statusError,
  emergencySending,
  onCreateCaseNumber,
  creatingCase,
  onNcicResult,
  pendingReports = [],
  onSubmitReport,
  submittingReportId,
  timeline = [],
  messages = [],
  showReports = false,
  soloWorkspacePanelId,
}: Props) {
  const [ncicMode, setNcicMode] = useState<"vehicle" | "person" | null>(null);
  const [lastNcic, setLastNcic] = useState<NcicQueryResult | null>(null);

  const { assignedIncidents, pendingIncidents } = useMemo(() => {
    const assigned: Incident[] = [];
    const pending: Incident[] = [];
    for (const inc of incidents) {
      if (isAssignedToUnit(inc, myCallSign)) assigned.push(inc);
      else pending.push(inc);
    }
    return { assignedIncidents: assigned, pendingIncidents: pending };
  }, [incidents, myCallSign]);

  const mapMarkers = useMemo(
    () =>
      mergeMapMarkers(
        incidentsToMarkers(incidents, selected?.id),
        unitsToMarkers(units, myCallSign),
      ),
    [incidents, selected?.id, units, myCallSign],
  );

  const pendingCount = pendingReports.length;

  if (soloWorkspacePanelId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <WorkspacePanel
          soloPanelId={soloWorkspacePanelId}
          pendingCount={pendingCount}
          selected={selected}
          mapMarkers={mapMarkers}
          showReports={showReports}
          pendingReports={pendingReports}
          onSubmitReport={onSubmitReport}
          submittingReportId={submittingReportId}
          timeline={timeline}
          messages={messages}
        />
      </div>
    );
  }

  const panels = useMemo((): LayoutPanel[] => {
    const items: LayoutPanel[] = [
      {
        id: "unit-status",
        title: "Unit Status",
        defaultWeight: 1.1,
        minHeight: 112,
        noPadding: true,
        content: (
          <UnitStatusPanel
            connected={connected}
            myUnitStatus={myUnitStatus}
            statusUpdating={statusUpdating}
            onStatusChange={onStatusChange}
            onSilentEmergency={onSilentEmergency}
            emergencySending={emergencySending}
            onNcicOpen={setNcicMode}
            lastNcic={lastNcic}
            selected={selected}
            onCreateCaseNumber={onCreateCaseNumber}
            creatingCase={creatingCase}
          />
        ),
      },
      {
        id: "assigned",
        title: "My Assigned Calls",
        count: assignedIncidents.length,
        defaultWeight: 1.2,
        minHeight: 72,
        noPadding: true,
        content: (
          <AssignedCallsSection
            embedded
            incidents={assignedIncidents}
            selected={selected}
            onSelect={onSelect}
            myCallSign={myCallSign}
          />
        ),
      },
      {
        id: "workspace",
        title: "Workspace",
        defaultWeight: 4.5,
        minHeight: 200,
        fillHeight: true,
        noPadding: true,
        content: (
          <WorkspacePanel
            pendingCount={pendingCount}
            selected={selected}
            mapMarkers={mapMarkers}
            showReports={showReports}
            pendingReports={pendingReports}
            onSubmitReport={onSubmitReport}
            submittingReportId={submittingReportId}
            timeline={timeline}
            messages={messages}
          />
        ),
      },
      {
        id: "pending",
        title: "Pending Calls",
        count: pendingIncidents.length,
        defaultWeight: 1.1,
        minHeight: 56,
        noPadding: true,
        content: (
          <PendingCallsDatabase
            embedded
            incidents={pendingIncidents}
            selected={selected}
            onSelect={onSelect}
          />
        ),
      },
    ];
    return items;
  }, [
    assignedIncidents,
    connected,
    creatingCase,
    emergencySending,
    lastNcic,
    mapMarkers,
    messages,
    myCallSign,
    myUnitStatus,
    onCreateCaseNumber,
    onSelect,
    onSilentEmergency,
    onStatusChange,
    onSubmitReport,
    pendingCount,
    pendingIncidents,
    pendingReports,
    selected,
    showReports,
    statusUpdating,
    submittingReportId,
    timeline,
  ]);

  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[520px] flex-col">
      {statusError && (
        <div className="shrink-0 border-b border-red-500/30 bg-red-600/10 px-4 py-1.5 text-sm text-red-300">
          {statusError}
        </div>
      )}

      <ResizablePanelLayout
        storageKey="layout-mdt-dashboard"
        direction="vertical"
        height="100%"
        className="min-h-0 flex-1"
        panels={panels}
      />

      <NcicLookupModal
        mode={ncicMode}
        incident={selected}
        onClose={() => setNcicMode(null)}
        onResult={(r) => {
          setLastNcic(r);
          onNcicResult?.(r);
        }}
      />
    </div>
  );
}

function UnitStatusPanel({
  connected,
  myUnitStatus,
  statusUpdating,
  onStatusChange,
  onSilentEmergency,
  emergencySending,
  onNcicOpen,
  lastNcic,
  selected,
  onCreateCaseNumber,
  creatingCase,
}: {
  connected: boolean;
  myUnitStatus?: UnitStatus;
  statusUpdating?: OfficerStatusAction | null;
  onStatusChange: (action: OfficerStatusAction) => void;
  onSilentEmergency: () => void;
  emergencySending?: boolean;
  onNcicOpen: (mode: "vehicle" | "person") => void;
  lastNcic: NcicQueryResult | null;
  selected: Incident | null;
  onCreateCaseNumber?: () => void;
  creatingCase?: boolean;
}) {
  const canCreateCase =
    !!onCreateCaseNumber &&
    !!selected &&
    !selected.case_number &&
    connected &&
    !creatingCase &&
    !statusUpdating;

  return (
    <div className="flex h-full min-h-0 flex-col justify-center px-2 py-2">
      <div className="mb-2 flex items-center justify-end gap-2 px-1">
        {!connected && <span className="text-[10px] text-amber-400">Not linked</span>}
        <span
          className={clsx("h-2 w-2 rounded-full", connected ? "bg-green-500" : "bg-red-500")}
          title={connected ? "CAD connected" : "CAD offline"}
        />
        {myUnitStatus && (
          <span className="text-[10px] font-mono uppercase text-slate-400">
            {myUnitStatus.replace(/_/g, " ")}
          </span>
        )}
      </div>
      <div className="flex w-full items-stretch gap-1.5">
        <div className="grid min-w-0 flex-1 grid-cols-6 gap-1.5">
          {STATUS_BUTTONS.map(({ action, label, shortLabel, color, activeStatus }) => {
            const isActive = activeStatus != null && myUnitStatus === activeStatus;
            const isLoading = statusUpdating === action;
            return (
              <button
                key={action}
                type="button"
                disabled={!connected || !!statusUpdating}
                onClick={() => onStatusChange(action)}
                className={clsx(
                  "mdt-status-square text-white",
                  color,
                  isActive && "ring-2 ring-white/70 ring-offset-1 ring-offset-[#141418]",
                  (!connected || statusUpdating) && "cursor-not-allowed opacity-50",
                )}
                title={label}
              >
                <span className="hidden sm:inline">{isLoading ? "…" : label}</span>
                <span className="sm:hidden">{isLoading ? "…" : shortLabel}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onNcicOpen("vehicle")}
          className="mdt-status-square shrink-0 border border-cyan-700/40 bg-cyan-900/50 text-cyan-100 hover:bg-cyan-800/70 min-w-[56px] max-w-[72px]"
          title="Vehicle Query"
        >
          <Car className="h-5 w-5 shrink-0" />
          <span className="hidden text-[10px] leading-tight sm:inline">Vehicle</span>
          <span className="text-[10px] leading-tight sm:hidden">Veh</span>
        </button>
        <button
          type="button"
          onClick={() => onNcicOpen("person")}
          className="mdt-status-square shrink-0 border border-cyan-700/40 bg-cyan-900/50 text-cyan-100 hover:bg-cyan-800/70 min-w-[56px] max-w-[72px]"
          title="Person Query"
        >
          <User className="h-5 w-5 shrink-0" />
          <span className="hidden text-[10px] leading-tight sm:inline">Person</span>
          <span className="text-[10px] leading-tight sm:hidden">Per</span>
        </button>
        {onCreateCaseNumber && (
          <button
            type="button"
            disabled={!canCreateCase}
            onClick={onCreateCaseNumber}
            className="mdt-status-square min-w-[56px] max-w-[72px] shrink-0 bg-indigo-700 text-white hover:bg-indigo-600 disabled:opacity-50"
            title="Create Case Number"
          >
            <FilePlus className="h-5 w-5 shrink-0" />
            <span className="hidden text-[10px] leading-tight sm:inline">
              {creatingCase ? "…" : "Case #"}
            </span>
            <span className="text-[10px] leading-tight sm:hidden">
              {creatingCase ? "…" : "Case"}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onSilentEmergency}
          disabled={emergencySending || !!statusUpdating}
          className={clsx(
            "mdt-status-square shrink-0 bg-red-700 text-white hover:bg-red-600 disabled:opacity-50",
            "min-w-[64px] max-w-[88px] ring-1 ring-red-900/50",
          )}
          title="Silent Emergency"
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span className="hidden text-[10px] leading-tight sm:inline">
            {emergencySending ? "Sending…" : "Silent Emergency"}
          </span>
          <span className="text-[10px] leading-tight sm:hidden">
            {emergencySending ? "…" : "SOS"}
          </span>
        </button>
      </div>
      {lastNcic && (
        <p
          className={clsx(
            "mt-1.5 truncate px-1 font-mono text-[10px]",
            lastNcic.status === "hit" ? "text-red-400" : "text-green-400",
          )}
          title={lastNcic.message}
        >
          Last NCIC: {lastNcic.message}
        </p>
      )}
    </div>
  );
}

function WorkspacePanel({
  pendingCount,
  selected,
  mapMarkers,
  showReports,
  pendingReports,
  onSubmitReport,
  submittingReportId,
  timeline,
  messages,
  soloPanelId,
}: {
  pendingCount: number;
  selected: Incident | null;
  mapMarkers: ReturnType<typeof mergeMapMarkers>;
  showReports: boolean;
  pendingReports: PendingReport[];
  onSubmitReport?: (reportId: string, narrative: string) => Promise<void>;
  submittingReportId?: string | null;
  timeline: TimelineEntry[];
  messages: DemoMessage[];
  soloPanelId?: string;
}) {
  const panels = useMemo((): LayoutPanel[] => {
    const items: LayoutPanel[] = [
      {
        id: "call",
        title: "Call",
        defaultWeight: 1.2,
        minWidth: 280,
        content: <CallInfoPane selected={selected} mapMarkers={mapMarkers} />,
      },
      {
        id: "map",
        title: "Map",
        defaultWeight: 1.3,
        minWidth: 260,
        fillHeight: true,
        content: <MapPane selected={selected} mapMarkers={mapMarkers} />,
      },
      {
        id: "tools",
        title: "Tools",
        count: pendingCount > 0 ? pendingCount : undefined,
        defaultWeight: 1,
        minWidth: 240,
        content: (
          <ToolsPane
            showReports={showReports}
            pendingReports={pendingReports}
            onSubmitReport={onSubmitReport}
            submittingReportId={submittingReportId}
          />
        ),
      },
      {
        id: "comms",
        title: "Comms",
        defaultWeight: 1.1,
        minWidth: 260,
        fillHeight: true,
        content: (
          <CommsPane timeline={timeline} messages={messages} incidentId={selected?.id} />
        ),
      },
    ];
    return items;
  }, [
    mapMarkers,
    messages,
    onSubmitReport,
    pendingCount,
    pendingReports,
    selected,
    showReports,
    submittingReportId,
    timeline,
  ]);

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
            "min-h-0 flex-1 overflow-y-auto p-3 md:p-4",
            panel.fillHeight && "flex flex-col overflow-hidden",
          )}
        >
          {panel.content}
        </div>
      </div>
    );
  }

  return (
    <PanelBody className="mdt-workspace flex flex-col border-0">
      <ResizablePanelLayout
        storageKey="layout-mdt-workspace"
        panels={panels}
        height="100%"
        className="min-h-0 flex-1"
        popout={{ workspace: "layout-mdt-workspace", basePath: "/popout/mdt" }}
      />
    </PanelBody>
  );
}

function AssignedCallsSection({
  incidents,
  selected,
  onSelect,
  myCallSign,
  embedded,
}: {
  incidents: Incident[];
  selected: Incident | null;
  onSelect: (inc: Incident) => void;
  myCallSign?: string;
  embedded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const showCompact = !expanded && incidents.length > 0;

  return (
    <div className={clsx("h-full min-h-0", embedded ? "px-2 py-2" : "mdt-assigned-strip")}>
      {!embedded && (
        <div className="mb-1.5 flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            My Assigned Calls
            {myCallSign && (
              <span className="ml-2 font-mono normal-case text-blue-400">{myCallSign}</span>
            )}
          </h2>
          <span className="text-[10px] text-slate-600">{incidents.length} active</span>
        </div>
      )}

      {embedded && incidents.length > 0 && (
        <div className="mb-1.5 flex items-center justify-end gap-2 px-1">
          {myCallSign && (
            <span className="mr-auto font-mono text-[10px] text-blue-400">{myCallSign}</span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400 hover:text-blue-300"
          >
            {expanded ? "Compact" : "Expand"}
          </button>
        </div>
      )}

      {!embedded && incidents.length > 0 && (
        <div className="mb-1.5 flex items-center justify-end gap-2 px-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400 hover:text-blue-300"
          >
            {expanded ? "Compact" : "Expand"}
          </button>
        </div>
      )}

      {incidents.length === 0 ? (
        <p className="px-1 py-1 text-sm text-slate-600">No calls assigned to your unit</p>
      ) : showCompact ? (
        <div className="flex h-full gap-2 overflow-x-auto overflow-y-hidden pb-0.5">
          {incidents.map((inc) => {
            const active = selected?.id === inc.id;
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => onSelect(inc)}
                className={clsx(
                  "mdt-assigned-card-compact",
                  active && "mdt-assigned-card--active",
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                      `priority-${inc.priority.toLowerCase()}`,
                    )}
                  >
                    {inc.priority}
                  </span>
                  <span className="font-mono text-xs text-slate-300">{inc.incident_number}</span>
                  <span className="text-[10px] font-mono uppercase text-slate-600 ml-auto">
                    {inc.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-100 truncate">{inc.nature}</p>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0 text-blue-400" />
                  {inc.location ?? "No location"}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="h-full space-y-2 overflow-y-auto">
          {incidents.map((inc) => {
            const active = selected?.id === inc.id;
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => onSelect(inc)}
                className={clsx("mdt-assigned-card w-full", active && "mdt-assigned-card--active")}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={clsx(
                        "text-sm font-bold px-2 py-0.5 rounded-lg border",
                        `priority-${inc.priority.toLowerCase()}`,
                      )}
                    >
                      {inc.priority}
                    </span>
                    <span className="font-mono text-base text-slate-300">{inc.incident_number}</span>
                    {inc.case_number && (
                      <span className="font-mono text-sm text-amber-400">{inc.case_number}</span>
                    )}
                  </div>
                  <span className="text-xs font-mono uppercase text-slate-500 shrink-0">
                    {inc.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-100 leading-snug mb-1">{inc.nature}</p>
                <p className="text-sm text-slate-400 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                  <span>{inc.location ?? "No location on file"}</span>
                </p>
                {(inc.weapons_involved || inc.report_required) && (
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {inc.weapons_involved && (
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> WEAPONS
                      </span>
                    )}
                    {inc.report_required && (
                      <span className="text-xs font-bold text-amber-400 uppercase">Report required</span>
                    )}
                  </div>
                )}
                {active && inc.latitude != null && inc.longitude != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${inc.latitude},${inc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Navigation className="w-4 h-4" />
                    Open navigation
                  </a>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PendingCallsDatabase({
  incidents,
  selected,
  onSelect,
  embedded,
}: {
  incidents: Incident[];
  selected: Incident | null;
  onSelect: (inc: Incident) => void;
  embedded?: boolean;
}) {
  const COL = "inline-block shrink-0";

  return (
    <div className={clsx("mdt-pending-db h-full min-h-0", embedded && "border-t-0")}>
      {!embedded && (
        <div className="flex items-center gap-3 border-b border-[#2a2a32] px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-600">
          <span className="shrink-0 font-bold text-slate-500">Pending Calls</span>
          <span className="truncate font-mono normal-case text-slate-600">
            INC# · PRI · TYPE · NATURE · LOCATION · STATUS
          </span>
          <span className="ml-auto shrink-0">{incidents.length} in queue</span>
        </div>
      )}
      {embedded && (
        <div className="border-b border-[#2a2a32]/60 px-3 py-1 font-mono text-[10px] text-slate-600">
          INC# · PRI · TYPE · NATURE · LOCATION · STATUS
        </div>
      )}
      <div className="h-full overflow-x-auto overflow-y-auto">
        {incidents.length === 0 ? (
          <p className="px-3 py-2 text-slate-600 text-xs font-mono">— no pending calls —</p>
        ) : (
          incidents.map((inc) => {
            const active = selected?.id === inc.id;
            return (
              <button
                key={inc.id}
                type="button"
                onClick={() => onSelect(inc)}
                className={clsx("mdt-pending-db-row", active && "mdt-pending-db-row--active")}
              >
                <span className={clsx(COL, "w-[108px] text-blue-300")}>{inc.incident_number}</span>
                <span className="text-slate-700 shrink-0">|</span>
                <span className={clsx(COL, "w-[28px]", `priority-${inc.priority.toLowerCase()}`, "border-0 bg-transparent px-0 py-0 text-inherit font-bold")}>
                  {inc.priority}
                </span>
                <span className="text-slate-700 shrink-0">|</span>
                <span className={clsx(COL, "w-[72px] uppercase text-slate-500")}>
                  {(inc.incident_type ?? "—").slice(0, 10)}
                </span>
                <span className="text-slate-700 shrink-0">|</span>
                <span className={clsx(COL, "w-[200px] text-slate-200 truncate")}>{inc.nature}</span>
                <span className="text-slate-700 shrink-0">|</span>
                <span className={clsx(COL, "w-[180px] text-slate-500 truncate")}>
                  {inc.location ?? "—"}
                </span>
                <span className="text-slate-700 shrink-0">|</span>
                <span className={clsx(COL, "w-[88px] uppercase text-slate-600")}>
                  {inc.status.replace(/_/g, " ")}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function CallInfoPane({
  selected,
  mapMarkers,
}: {
  selected: Incident | null;
  mapMarkers: ReturnType<typeof mergeMapMarkers>;
}) {
  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[min(40dvh,100%)] text-slate-500 gap-3 py-12">
        <ClipboardList className="w-12 h-12 opacity-40" />
        <p className="text-lg">Select an assigned call or pending row below</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-none">
      <div className="mdt-read-pane border border-[#2a2a32]">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className={clsx(
              "text-sm font-bold px-2 py-0.5 rounded-lg border",
              `priority-${selected.priority.toLowerCase()}`,
            )}
          >
            {selected.priority}
          </span>
          <span className="font-mono text-lg text-slate-300">{selected.incident_number}</span>
          {selected.case_number && (
            <span className="font-mono text-base text-amber-400">{selected.case_number}</span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-100 leading-tight mb-2">{selected.nature}</h2>
        <p className="text-lg text-slate-300 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
          {selected.location ?? "No location"}
        </p>
      </div>

      {selected.report_required && (
        <div className="mdt-read-pane border border-amber-500/40 bg-amber-600/10 text-amber-200 text-sm font-semibold uppercase tracking-wide">
          Mandatory case report — submit before 10-8
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReadField label="Location" value={selected.location} large />
        <ReadField label="Cross Streets" value={selected.cross_streets} />
        <ReadField label="Caller" value={selected.caller_name} />
        <ReadField label="Phone" value={selected.caller_phone} mono />
        <ReadField label="Type" value={selected.incident_type} />
        <ReadField label="Status" value={selected.status?.replace(/_/g, " ")} />
      </div>

      {selected.notes && (
        <div>
          <p className="mdt-read-label">Dispatch Notes</p>
          <div className="mdt-read-pane text-base">{selected.notes}</div>
        </div>
      )}

      {selected.narrative && (
        <div>
          <p className="mdt-read-label">Narrative</p>
          <div className="mdt-read-pane text-base">{selected.narrative}</div>
        </div>
      )}

      {selected.assignments && selected.assignments.length > 0 && (
        <div>
          <p className="mdt-read-label">Assigned Units</p>
          <div className="flex flex-wrap gap-2">
            {selected.assignments.map((a, i) => (
              <span
                key={i}
                className="px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg text-base font-mono font-semibold"
              >
                {a.call_sign ?? a.unit_id.slice(0, 8)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mdt-read-label mb-2">Incident Map Preview</p>
        <TacticalMapLazy
          markers={mapMarkers}
          fitToMarkers={mapMarkers.length > 1}
          height={280}
          zoom={14}
        />
      </div>
    </div>
  );
}

function MapPane({
  selected,
  mapMarkers,
}: {
  selected: Incident | null;
  mapMarkers: ReturnType<typeof mergeMapMarkers>;
}) {
  return (
    <div className="h-full flex flex-col gap-3 min-h-[min(45dvh,100%)]">
      {selected?.latitude != null && selected?.longitude != null && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mdt-vehicle-btn bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center gap-3 shrink-0"
        >
          <Navigation className="w-6 h-6" />
          Navigate to {selected.location ?? "Call Location"}
        </a>
      )}
      <div className="flex-1 min-h-[min(38dvh,480px)] rounded-xl overflow-hidden border border-[#2a2a32]">
        <TacticalMapLazy
          markers={mapMarkers}
          fitToMarkers={mapMarkers.length > 0}
          height="100%"
          zoom={selected ? 14 : 11}
          className="h-full min-h-[min(38dvh,480px)]"
        />
      </div>
      {selected && (
        <div className="mdt-read-pane shrink-0">
          <p className="mdt-read-label">Active Call</p>
          <p className="mdt-read-value">{selected.nature}</p>
          <p className="text-base text-slate-400 mt-1">{selected.location}</p>
        </div>
      )}
    </div>
  );
}

function ToolsPane({
  showReports,
  pendingReports,
  onSubmitReport,
  submittingReportId,
}: {
  showReports: boolean;
  pendingReports: PendingReport[];
  onSubmitReport?: (reportId: string, narrative: string) => Promise<void>;
  submittingReportId?: string | null;
}) {
  if (showReports && onSubmitReport) {
    return (
      <ReportWritingPanel
        reports={pendingReports}
        onSubmit={onSubmitReport}
        submittingId={submittingReportId}
        variant="vehicle"
      />
    );
  }

  return (
    <div className="flex min-h-[min(40dvh,100%)] flex-col items-center justify-center py-12 text-slate-500">
      <Wrench className="mb-3 h-10 w-10 opacity-40" />
      <p className="text-base">No tools for this call</p>
    </div>
  );
}

function CommsPane({
  timeline,
  messages,
  incidentId,
}: {
  timeline: TimelineEntry[];
  messages: DemoMessage[];
  incidentId?: string;
}) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-[min(45dvh,100%)]">
      <div className="tactical-panel flex-1 min-h-[200px] flex flex-col overflow-hidden">
        <MessagingPanel messages={messages} incidentId={incidentId} recipientRole="dispatcher" variant="vehicle" />
      </div>
      <div className="tactical-panel flex-1 min-h-[160px] overflow-y-auto p-4">
        <p className="mdt-read-label mb-3">Activity Timeline</p>
        <IncidentTimeline entries={timeline} limit={25} />
      </div>
    </div>
  );
}

function ReadField({
  label,
  value,
  large,
  mono,
  highlight,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="mdt-read-pane">
      <p className="mdt-read-label">{label}</p>
      <p
        className={clsx(
          large ? "text-xl font-bold" : "mdt-read-value",
          mono && "font-mono",
          highlight && "text-amber-300",
        )}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
