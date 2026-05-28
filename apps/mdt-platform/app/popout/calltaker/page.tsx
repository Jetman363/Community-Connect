"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { registerPopout, unregisterPopout } from "@/lib/panel-popout-store";

const WORKSPACE = "layout-calltaker-page";

function CalltakerPopoutInner() {
  const searchParams = useSearchParams();
  const panelId = searchParams.get("panel") ?? "timeline";
  const workspace = searchParams.get("workspace") ?? WORKSPACE;
  const { timeline } = useDemo();

  useEffect(() => {
    registerPopout({
      workspace,
      panelId,
      title: panelId === "timeline" ? "Live Timeline" : panelId,
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

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-[#0c0c0e]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#2a2a32] px-3 py-2">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Calltaker Popout</span>
        <ConnectionStatus />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {panelId === "timeline" ? (
          <IncidentTimeline entries={timeline} />
        ) : (
          <p className="text-slate-500">
            Popout for &quot;{panelId}&quot; — use the main calltaker window for intake workspace.
          </p>
        )}
      </div>
    </div>
  );
}

export default function CalltakerPopoutPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["calltaker"]} loginPath="/calltaker/login" user={user} requireServiceArea={false}>
      <Suspense fallback={<div className="p-4 text-slate-500">Loading panel…</div>}>
        {user && <CalltakerPopoutInner />}
      </Suspense>
    </ProgramGate>
  );
}
