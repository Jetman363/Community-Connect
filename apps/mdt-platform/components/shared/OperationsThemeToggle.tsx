"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useMdtTheme } from "@/lib/mdt-theme-context";
import { useHydrated } from "@/lib/use-hydrated";

/** Night/day toggle for all operations consoles — place in header upper-right. */
export function OperationsThemeToggle() {
  const hydrated = useHydrated();
  const { scheme, toggleScheme } = useMdtTheme();
  const isLight = scheme === "light";

  if (!hydrated) {
    return <div className="h-5 w-[4.5rem] shrink-0" aria-hidden />;
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Moon className={clsx("w-3.5 h-3.5", isLight ? "text-slate-400" : "text-slate-300")} aria-hidden />
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label={isLight ? "Switch to night mode" : "Switch to day mode"}
        onClick={toggleScheme}
        className={clsx(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--mdt-panel)]",
          isLight ? "border-blue-400/50 bg-blue-500/30" : "border-[var(--mdt-border)] bg-[var(--mdt-surface)]",
        )}
      >
        <span
          className={clsx(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm transition-transform",
            isLight ? "translate-x-4 bg-blue-500" : "translate-x-0.5 bg-slate-500",
          )}
        />
      </button>
      <Sun className={clsx("w-3.5 h-3.5", isLight ? "text-amber-400" : "text-slate-400")} aria-hidden />
    </div>
  );
}
