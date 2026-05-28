"use client";

import { useCallback, useState } from "react";
import clsx from "clsx";
import { Monitor, MonitorSmartphone, SplitSquareHorizontal } from "lucide-react";
import { pickSecondaryScreen } from "@/lib/multi-screen";
import { openPanelPopout } from "@/lib/panel-popout-store";
import { getSecondaryPanelsForWorkspace } from "@/lib/split-layout-config";
import { useMultiScreen } from "@/lib/use-multi-screen";

interface PanelRef {
  id: string;
  title: string;
}

interface Props {
  workspace: string;
  storageKey: string;
  popoutBasePath: string;
  panels: PanelRef[];
  className?: string;
}

export function MultiScreenControls({
  workspace,
  storageKey,
  popoutBasePath,
  panels,
  className,
}: Props) {
  const { screens, multiScreen, permissionGranted, requestPermission } = useMultiScreen();
  const [splitting, setSplitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const secondaryPanels = getSecondaryPanelsForWorkspace(storageKey);
  const secondaryScreen = pickSecondaryScreen(screens);

  const splitToMonitors = useCallback(async () => {
    if (!multiScreen || !secondaryScreen) return;
    setSplitting(true);
    setMessage(null);
    try {
      let opened = 0;
      for (const panelId of secondaryPanels) {
        const panel = panels.find((p) => p.id === panelId);
        if (!panel) continue;
        const win = await openPanelPopout({
          workspace,
          panelId,
          title: panel.title,
          basePath: popoutBasePath,
          screen: secondaryScreen,
        });
        if (win) opened += 1;
      }
      if (opened === 0) {
        setMessage("Could not open secondary window — check popup blocker.");
      } else {
        setMessage(`Opened ${opened} panel${opened === 1 ? "" : "s"} on ${secondaryScreen.label}.`);
      }
    } finally {
      setSplitting(false);
    }
  }, [multiScreen, secondaryScreen, secondaryPanels, panels, workspace, popoutBasePath]);

  if (!multiScreen && permissionGranted !== false) return null;

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-3 py-1.5",
        className,
      )}
    >
      <MonitorSmartphone className="h-4 w-4 shrink-0 text-cyan-400" />
      <span className="text-xs text-cyan-200/90">
        {multiScreen
          ? `${screens.length} displays detected`
          : "Enable display detection for multi-monitor split"}
      </span>
      {multiScreen && secondaryPanels.length > 0 && (
        <button
          type="button"
          disabled={splitting}
          onClick={() => void splitToMonitors()}
          className="flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-600/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-600/25 disabled:opacity-50"
        >
          <SplitSquareHorizontal className="h-3.5 w-3.5" />
          {splitting ? "Splitting…" : "Split to monitors"}
        </button>
      )}
      {permissionGranted === false && (
        <button
          type="button"
          onClick={() => void requestPermission()}
          className="flex items-center gap-1 rounded border border-slate-600 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
        >
          <Monitor className="h-3.5 w-3.5" />
          Allow display access
        </button>
      )}
      {message && <span className="text-[10px] text-slate-500">{message}</span>}
    </div>
  );
}
