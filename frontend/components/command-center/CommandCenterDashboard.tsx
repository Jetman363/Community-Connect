"use client";

import { CommandCenterKpis } from "@/components/command-center/CommandCenterKpis";
import { GeospatialMap } from "@/components/command-center/GeospatialMap";
import { IntelligenceFeed } from "@/components/command-center/IntelligenceFeed";
import { LiveAlertStream } from "@/components/command-center/LiveAlertStream";
import { OfficerSafetyPanel } from "@/components/command-center/OfficerSafetyPanel";
import { ThreatScorePanel } from "@/components/command-center/ThreatScorePanel";
import { PriorityBadge, StatusDot } from "@/components/ui/DataDisplay";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import {
  buildGeoMarkers,
  buildIntelFeed,
  computeStats,
} from "@/lib/command-center";
import { ACTIVE_INCIDENTS, UNITS } from "@/lib/mock-data";
import { formatTime } from "@/lib/utils";
import { MapPin, Radio } from "lucide-react";
import { useMemo, useState } from "react";

import type { ReactNode } from "react";

interface CommandCenterDashboardProps {
  token: string | null;
  agencyId?: string;
  agencyName?: string;
  authMode?: string;
  shell?: (
    content: ReactNode,
    meta: { criticalCount: number; connected: boolean }
  ) => ReactNode;
}

export function CommandCenterDashboard({
  token,
  agencyId,
  agencyName = "Metro PD",
  authMode = "demo",
  shell,
}: CommandCenterDashboardProps) {
  const { alerts, connected, loading, error, usingMock, refresh } = useLiveAlerts({
    token,
    agencyId,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const intelFeed = useMemo(() => buildIntelFeed(alerts), [alerts]);
  const geoMarkers = useMemo(() => buildGeoMarkers(alerts), [alerts]);
  const stats = useMemo(() => computeStats(alerts, intelFeed.length), [alerts, intelFeed.length]);

  const selectedAlert = alerts.find((a) => a.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const criticalCount = alerts.filter((a) => a.priority === "critical").length;

  const content = (
    <div className="space-y-4">
      <CommandCenterKpis stats={stats} />

      {/* Officer safety banner — full width when active */}
      {stats.officerSafety > 0 && (
        <OfficerSafetyPanel alerts={alerts} onSelect={handleSelect} />
      )}

      {/* Main grid: map + threat scoring */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 panel flex flex-col">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Geospatial Event Map</span>
              <span className="text-xs text-slate-500">
                {geoMarkers.length} markers · {agencyName}
              </span>
            </div>
            {selectedAlert && (
              <PriorityBadge priority={selectedAlert.priority} />
            )}
          </div>
          <div className="p-3 flex-1 min-h-[340px]">
            <GeospatialMap
              markers={geoMarkers}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>
          {selectedAlert && (
            <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-900/50">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Selected event</p>
              <p className="text-sm text-slate-200">{selectedAlert.message}</p>
              <div className="flex gap-4 mt-1 text-[10px] text-slate-600">
                <span>Threat {Math.round(selectedAlert.threatScore)}</span>
                <span>{selectedAlert.sourceSystem}</span>
                <span className="tabular-nums">{formatTime(selectedAlert.timestamp)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 min-h-[400px]">
          <ThreatScorePanel alerts={alerts} selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </div>

      {/* Incidents + intel + live stream */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-white">Active Incidents</span>
              <span className="text-xs text-slate-500">({ACTIVE_INCIDENTS.length} CAD)</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="data-table w-full">
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr>
                  <th>Incident</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVE_INCIDENTS.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="font-mono text-xs text-cyan-400">{inc.id}</td>
                    <td className="text-slate-300 text-xs max-w-[140px] truncate">{inc.callType}</td>
                    <td>
                      <PriorityBadge priority={inc.priority} />
                    </td>
                    <td className="text-slate-400 text-xs">{inc.status}</td>
                    <td className="text-slate-500 text-xs tabular-nums">{formatTime(inc.reportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-4 min-h-[320px]">
          <IntelligenceFeed items={intelFeed} onSelectAlert={handleSelect} />
        </div>

        <div className="xl:col-span-3 min-h-[320px]">
          <LiveAlertStream
            alerts={alerts}
            connected={connected}
            loading={loading}
            usingMock={usingMock}
            error={error}
            selectedId={selectedId}
            onSelect={handleSelect}
            onRefresh={refresh}
          />
        </div>
      </div>

      {/* Unit status row */}
      <div className="panel">
        <div className="panel-header">
          <span className="text-sm font-medium text-white">Unit Status</span>
          <span className="text-xs text-slate-500">{authMode === "api" ? "Live dispatch" : "Demo data"}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-slate-800/50">
          {UNITS.map((unit) => (
            <div key={unit.id} className="px-4 py-3 hover:bg-slate-800/20">
              <div className="text-sm font-mono text-cyan-400">{unit.callSign}</div>
              <div className="text-xs text-slate-500 truncate">{unit.officer}</div>
              <div className="mt-1">
                <StatusDot status={unit.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (shell) {
    return shell(content, { criticalCount, connected });
  }

  return content;
}
