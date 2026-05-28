"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useHydrated } from "@/lib/use-hydrated";

export interface TabbedPanel {
  id: string;
  title: string;
  count?: number;
  fillHeight?: boolean;
  content: React.ReactNode;
}

interface Props {
  storageKey: string;
  panels: TabbedPanel[];
  defaultTabId?: string;
  className?: string;
  height?: string;
}

export function TabbedPanelLayout({
  storageKey,
  panels,
  defaultTabId,
  className,
  height = "100%",
}: Props) {
  const hydrated = useHydrated();
  const fallbackId = defaultTabId ?? panels[0]?.id ?? "";
  const [activeId, setActiveId] = useState(fallbackId);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && panels.some((p) => p.id === saved)) {
        setActiveId(saved);
      }
    } catch {
      /* ignore */
    }
  }, [hydrated, storageKey, panels]);

  const selectTab = (id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, id);
    }
  };

  const active = panels.find((p) => p.id === activeId) ?? panels[0];

  if (!active) return null;

  return (
    <div className={clsx("flex min-h-0 flex-col", className)} style={{ height }}>
      <nav className="mdt-tab-bar shrink-0 border-b border-t-0 bg-[#141418]" aria-label="Panel tabs">
        {panels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => selectTab(panel.id)}
            className={clsx("dispatch-tab", activeId === panel.id && "dispatch-tab--active")}
            aria-current={activeId === panel.id ? "page" : undefined}
          >
            <span>{panel.title}</span>
            {panel.count !== undefined && (
              <span className="font-mono text-[10px]">{panel.count}</span>
            )}
          </button>
        ))}
      </nav>
      <div
        className={clsx(
          "min-h-0 flex-1 overflow-y-auto p-2",
          active.fillHeight && "flex flex-col overflow-hidden",
        )}
      >
        {active.content}
      </div>
    </div>
  );
}
