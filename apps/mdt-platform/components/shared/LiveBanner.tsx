"use client";

import clsx from "clsx";
import { Activity, Radio } from "lucide-react";
import { useDemo } from "@/lib/demo-store";
import { useAuth } from "@/lib/auth-context";

export function LiveBanner() {
  const { liveBanner, connected, activeScenario } = useDemo();
  if (!liveBanner && !activeScenario) return null;

  return (
    <div className={clsx(
      "fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-3 text-sm font-semibold animate-pulse",
      liveBanner?.includes("BACKUP") || liveBanner?.includes("ESCALATED") ? "bg-red-600 text-white" : "bg-blue-600 text-white"
    )}>
      <Radio className="w-4 h-4" />
      {liveBanner ?? `Scenario running: ${(activeScenario as { name?: string })?.name}`}
      <span className={clsx("w-2 h-2 rounded-full ml-2", connected ? "bg-green-300" : "bg-red-300")} />
    </div>
  );
}

export function ConnectionStatus() {
  const { connected, demoMode } = useDemo();
  const { token } = useAuth();
  if (!token) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Activity className="w-3 h-3" />
        <span>Sign in for live sync</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <Activity className={clsx("w-3 h-3", connected ? "text-green-500" : "text-red-500")} />
      <span className={connected ? "text-green-500" : "text-red-500"}>{connected ? "LIVE" : "OFFLINE"}</span>
      {demoMode && <span className="text-purple-400 ml-1">DEMO</span>}
    </span>
  );
}
