"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CommandCenterDashboard } from "@/components/command-center/CommandCenterDashboard";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { token, officer, authMode } = useAuth();

  return (
    <CommandCenterDashboard
      token={token}
      agencyId={officer?.agencyId}
      agencyName={officer?.agency}
      authMode={authMode}
      shell={(content, { criticalCount, connected }) => (
        <AppShell
          title="Command Center"
          subtitle={`Real-time situational awareness · ${officer?.agency ?? "Metro PD"} · ${authMode === "api" ? "Live API" : "Demo"}`}
          criticalAlerts={criticalCount}
          wsConnected={connected}
        >
          {content}
        </AppShell>
      )}
    />
  );
}
