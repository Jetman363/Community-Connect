"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LiveAlertsPanel } from "@/components/alerts/LiveAlertsPanel";
import { useAuth } from "@/lib/auth-context";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";

export default function AlertsPage() {
  const { token, officer, authMode } = useAuth();
  const { alerts, connected, loading, error, usingMock, refresh } = useLiveAlerts({
    token,
    agencyId: officer?.agencyId,
  });

  const officerSafety = alerts.filter((a) => a.officerSafety);
  const critical = alerts.filter((a) => a.priority === "critical");

  return (
    <AppShell
      title="Alert Operations"
      subtitle={`Real-time alert engine · ${authMode === "api" ? "Connected" : "Demo mode"}`}
      criticalAlerts={critical.length}
      wsConnected={connected}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="panel p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Active Alerts</div>
          <div className="text-3xl font-semibold text-white mt-1">{alerts.length}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Critical</div>
          <div className="text-3xl font-semibold text-red-400 mt-1">{critical.length}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Officer Safety</div>
          <div className="text-3xl font-semibold text-amber-400 mt-1">{officerSafety.length}</div>
        </div>
      </div>

      <LiveAlertsPanel
        alerts={alerts}
        connected={connected}
        loading={loading}
        usingMock={usingMock}
        error={error}
        token={token}
        agencyId={officer?.agencyId}
        onRefresh={refresh}
      />
    </AppShell>
  );
}
