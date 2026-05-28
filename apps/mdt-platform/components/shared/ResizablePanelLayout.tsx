"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ExternalLink, GripHorizontal, GripVertical, Monitor, RotateCcw } from "lucide-react";
import { loadPanelLayout, normalizeLayout, resetPanelLayout, savePanelLayout } from "@/lib/panel-layout-storage";
import {
  dockPanelPopout,
  openPanelPopout,
} from "@/lib/panel-popout-store";
import { pickSecondaryScreen, queryScreens } from "@/lib/multi-screen";
import { useMultiScreen } from "@/lib/use-multi-screen";
import { usePanelPopouts } from "@/lib/use-panel-popouts";
import { useHydrated } from "@/lib/use-hydrated";

export interface LayoutPanel {
  id: string;
  title: string;
  count?: number;
  minWidth?: number;
  minHeight?: number;
  /** Relative default size share before user customization */
  defaultWeight?: number;
  /** When true, panel body fills available space without outer scroll (for nested layouts) */
  fillHeight?: boolean;
  /** Skip default padding on panel body */
  noPadding?: boolean;
  content: React.ReactNode;
}

export interface PopoutConfig {
  /** Unique workspace id shared with popout window */
  workspace: string;
  /** Base route for popout pages, e.g. /popout/dispatch */
  basePath: string;
}

interface Props {
  storageKey: string;
  panels: LayoutPanel[];
  className?: string;
  height?: string;
  direction?: "horizontal" | "vertical";
  onReset?: () => void;
  popout?: PopoutConfig;
}

const DEFAULT_MIN_WIDTH = 160;
const DEFAULT_MIN_HEIGHT = 48;

export function ResizablePanelLayout({
  storageKey,
  panels,
  className,
  height = "calc(100vh - 5rem)",
  direction = "horizontal",
  onReset,
  popout,
}: Props) {
  const vertical = direction === "vertical";
  const hydrated = useHydrated();
  const { multiScreen } = useMultiScreen();
  const { isPoppedOut } = usePanelPopouts(popout?.workspace ?? storageKey);
  const workspaceId = popout?.workspace ?? storageKey;

  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(() => {
    const defaultWeights = Object.fromEntries(panels.map((p) => [p.id, p.defaultWeight ?? 1]));
    return normalizeLayout(
      panels.map((p) => p.id),
      defaultWeights,
    );
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const resizingRef = useRef<{
    beforeId: string;
    afterId: string;
    startPos: number;
    beforeStart: number;
    afterStart: number;
  } | null>(null);

  const panelMap = useMemo(() => new Map(panels.map((p) => [p.id, p])), [panels]);

  const panelIds = panels.map((p) => p.id).join(",");

  useEffect(() => {
    if (!hydrated) return;
    const defaultWeights = Object.fromEntries(panels.map((p) => [p.id, p.defaultWeight ?? 1]));
    setLayout(loadPanelLayout(storageKey, panels.map((p) => p.id), defaultWeights));
  }, [hydrated, storageKey, panelIds, panels]);

  const persist = useCallback(
    (next: typeof layout) => {
      setLayout(next);
      savePanelLayout(storageKey, next);
    },
    [storageKey],
  );

  const handleReset = () => {
    resetPanelLayout(storageKey);
    const defaultWeights = Object.fromEntries(panels.map((p) => [p.id, p.defaultWeight ?? 1]));
    const next = normalizeLayout(panels.map((p) => p.id), defaultWeights);
    setLayout(next);
    onReset?.();
  };

  const handlePopout = useCallback(
    async (panel: LayoutPanel) => {
      if (!popout) return;
      const screens = await queryScreens();
      const screen = pickSecondaryScreen(screens) ?? screens[0];
      if (!screen) return;
      await openPanelPopout({
        workspace: workspaceId,
        panelId: panel.id,
        title: panel.title,
        basePath: popout.basePath,
        screen,
      });
    },
    [popout, workspaceId],
  );

  const handleDock = useCallback(
    (panelId: string) => {
      dockPanelPopout(workspaceId, panelId);
    },
    [workspaceId],
  );

  const orderedPanels = layout.order
    .map((id) => panelMap.get(id))
    .filter((p): p is LayoutPanel => !!p);

  const visiblePanels = orderedPanels.filter((p) => !isPoppedOut(p.id));

  const startResize = (beforeId: string, afterId: string, clientPos: number) => {
    resizingRef.current = {
      beforeId,
      afterId,
      startPos: clientPos,
      beforeStart: layout.widths[beforeId] ?? 0.25,
      afterStart: layout.widths[afterId] ?? 0.25,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r || !containerRef.current) return;
      document.body.style.cursor = vertical ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
      const rect = containerRef.current.getBoundingClientRect();
      const axisSize = vertical ? rect.height : rect.width;
      const delta = ((vertical ? e.clientY : e.clientX) - r.startPos) / axisSize;
      const beforePanel = panelMap.get(r.beforeId);
      const afterPanel = panelMap.get(r.afterId);
      const minBefore = vertical
        ? (beforePanel?.minHeight ?? DEFAULT_MIN_HEIGHT) / axisSize
        : (beforePanel?.minWidth ?? DEFAULT_MIN_WIDTH) / axisSize;
      const minAfter = vertical
        ? (afterPanel?.minHeight ?? DEFAULT_MIN_HEIGHT) / axisSize
        : (afterPanel?.minWidth ?? DEFAULT_MIN_WIDTH) / axisSize;
      let nextBefore = r.beforeStart + delta;
      let nextAfter = r.afterStart - delta;
      if (nextBefore < minBefore) {
        nextAfter -= minBefore - nextBefore;
        nextBefore = minBefore;
      }
      if (nextAfter < minAfter) {
        nextBefore -= minAfter - nextAfter;
        nextAfter = minAfter;
      }
      if (nextBefore < minBefore || nextAfter < minAfter) return;
      persist({
        ...layout,
        widths: { ...layout.widths, [r.beforeId]: nextBefore, [r.afterId]: nextAfter },
      });
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [layout, panelMap, persist, vertical]);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDropTargetId(null);
      return;
    }
    const order = [...layout.order];
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, dragId);
    persist({ ...layout, order });
    setDragId(null);
    setDropTargetId(null);
  };

  const GripIcon = vertical ? GripHorizontal : GripVertical;
  const popoutEnabled = !!popout && multiScreen;

  return (
    <div className={clsx("flex min-h-0 flex-col gap-1", className)}>
      <div className="flex shrink-0 items-center justify-between px-1">
        <p className="text-[10px] text-slate-600">
          {vertical
            ? "Drag section headers to reorder · drag dividers to resize"
            : "Drag column headers to reorder · drag dividers to resize"}
          {popoutEnabled && " · pop out panels to another display"}
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded border border-transparent px-2 py-0.5 text-[10px] text-slate-500 hover:border-[#2a2a32] hover:text-slate-300"
          title="Reset section order and sizes"
        >
          <RotateCcw className="h-3 w-3" /> Reset layout
        </button>
      </div>
      <div
        ref={containerRef}
        className={clsx(
          "flex min-h-0 flex-1 select-none gap-0",
          vertical ? "flex-col" : "flex-row",
        )}
        style={{ height }}
      >
        {orderedPanels.map((panel, index) => {
          const popped = isPoppedOut(panel.id);
          const visibleWeightSum =
            visiblePanels.reduce((sum, p) => sum + (layout.widths[p.id] ?? 1), 0) || 1;
          const isDropTarget = dropTargetId === panel.id && dragId !== panel.id;

          const effectiveSize = popped
            ? vertical
              ? { height: 56, flexShrink: 0 }
              : { width: 140, flexShrink: 0 }
            : vertical
              ? { height: `${((layout.widths[panel.id] ?? 1) / visibleWeightSum) * 100}%` }
              : { width: `${((layout.widths[panel.id] ?? 1) / visibleWeightSum) * 100}%` };

          if (popped) {
            return (
              <div
                key={panel.id}
                className={clsx("flex min-h-0 min-w-0 shrink-0", vertical ? "w-full" : "flex-row")}
                style={effectiveSize}
              >
                <div className="tactical-panel flex w-full flex-col overflow-hidden border border-cyan-500/20 bg-cyan-950/10">
                  <div className="flex items-center gap-1.5 border-b border-cyan-500/20 px-2 py-1.5">
                    <Monitor className="h-3.5 w-3.5 text-cyan-400" />
                    <h3 className="truncate text-xs uppercase tracking-wider text-cyan-300/80">
                      {panel.title}
                    </h3>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 p-3 text-center">
                    <p className="text-[11px] text-slate-500">Open on secondary display</p>
                    <button
                      type="button"
                      onClick={() => handleDock(panel.id)}
                      className="rounded border border-cyan-500/40 px-2 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-600/15"
                    >
                      Pop back in
                    </button>
                  </div>
                </div>
                {index < orderedPanels.length - 1 && !isPoppedOut(orderedPanels[index + 1]?.id ?? "") && (
                  <div className={clsx("shrink-0", vertical ? "h-1.5 w-full" : "w-1.5")} />
                )}
              </div>
            );
          }

          return (
            <div
              key={panel.id}
              className={clsx("flex min-h-0 min-w-0 flex-1", vertical ? "w-full flex-col" : "flex-row")}
              style={effectiveSize}
            >
              <div
                className={clsx(
                  "tactical-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                  isDropTarget && "ring-2 ring-blue-500/60",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetId(panel.id);
                }}
                onDragLeave={() => setDropTargetId((id) => (id === panel.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(panel.id);
                }}
              >
                <div
                  draggable
                  onDragStart={() => setDragId(panel.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropTargetId(null);
                  }}
                  className="flex cursor-grab items-center gap-1.5 border-b border-[#2a2a32] bg-[#141418] px-2 py-1.5 active:cursor-grabbing"
                  title={vertical ? "Drag to reorder section" : "Drag to reorder column"}
                >
                  <GripIcon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  <h3 className="truncate text-xs uppercase tracking-wider text-slate-500">{panel.title}</h3>
                  {panel.count !== undefined && (
                    <span className="font-mono text-xs text-slate-600">{panel.count}</span>
                  )}
                  {popoutEnabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handlePopout(panel);
                      }}
                      className="ml-auto rounded p-0.5 text-slate-600 hover:bg-[#2a2a32] hover:text-cyan-400"
                      title={`Open ${panel.title} on another display`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div
                  className={clsx(
                    "min-h-0 flex-1",
                    !panel.noPadding && "p-2",
                    panel.fillHeight ? "flex flex-col overflow-hidden" : "overflow-y-auto overflow-x-hidden",
                  )}
                >
                  {panel.content}
                </div>
              </div>
              {index < orderedPanels.length - 1 &&
                !popped &&
                !isPoppedOut(orderedPanels[index + 1]?.id ?? "") && (
                <div
                  role="separator"
                  aria-orientation={vertical ? "horizontal" : "vertical"}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const nextVisible = orderedPanels.slice(index + 1).find((p) => !isPoppedOut(p.id));
                    if (!nextVisible) return;
                    startResize(
                      panel.id,
                      nextVisible.id,
                      vertical ? e.clientY : e.clientX,
                    );
                  }}
                  className={clsx(
                    "group relative z-10 shrink-0 hover:bg-blue-500/30",
                    vertical
                      ? "h-1.5 w-full cursor-row-resize"
                      : "w-1.5 cursor-col-resize",
                  )}
                  title={vertical ? "Drag to resize sections" : "Drag to resize columns"}
                >
                  <div
                    className={clsx(
                      "absolute group-hover:bg-blue-500/20",
                      vertical ? "inset-x-0 -top-0.5 -bottom-0.5" : "inset-y-0 -left-0.5 -right-0.5",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Wrapper for panel body content that should fill height without extra padding from layout. */
export function PanelBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("h-full min-h-0", className)}>{children}</div>;
}
