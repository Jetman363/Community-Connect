"use client";

import { Play, Square, Zap } from "lucide-react";
import clsx from "clsx";
import { startScenario, stopScenario, toggleDemoMode } from "@/lib/demo-api";
import { useDemo } from "@/lib/demo-store";
import { useHydrated } from "@/lib/use-hydrated";

export function DemoControlPanel() {
  const { demoMode, scenarios, activeScenario, refresh } = useDemo();
  const hydrated = useHydrated();

  const handleToggle = async () => {
    await toggleDemoMode(!demoMode);
    refresh();
  };

  const handleStart = async (id: string) => {
    await startScenario(id);
    refresh();
  };

  const handleStop = async () => {
    await stopScenario();
    refresh();
  };

  return (
    <div className="tactical-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-slate-200">Demo Mode</span>
        </div>
        <button
          onClick={handleToggle}
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-bold transition-colors min-w-[2.5rem]",
            hydrated && demoMode ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400",
          )}
        >
          {hydrated ? (demoMode ? "ON" : "OFF") : "…"}
        </button>
      </div>

      {activeScenario && (
        <div className="bg-purple-600/10 border border-purple-500/30 rounded p-2 text-xs text-purple-300 animate-pulse">
          Running: {(activeScenario as { name?: string }).name}
          <button onClick={handleStop} className="ml-2 underline">Stop</button>
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500 uppercase mb-2">Start Demo Scenario</p>
        <div className="space-y-1.5">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStart(s.id)}
              disabled={!!activeScenario}
              className="w-full text-left p-2 rounded border border-[#2a2a32] bg-[#1a1a20] hover:border-purple-500/50 disabled:opacity-50 group"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3 h-3 text-purple-400 group-hover:text-purple-300" />
                <span className="text-sm font-medium text-slate-200">{s.name}</span>
                <span className={clsx("text-[10px] font-bold px-1 rounded ml-auto", `priority-${s.priority.toLowerCase()}`)}>{s.priority}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 ml-5">{s.description}</p>
            </button>
          ))}
        </div>
      </div>

      {activeScenario && (
        <button onClick={handleStop} className="w-full tactical-btn bg-red-600/20 border border-red-500/50 text-red-300 flex items-center justify-center gap-2">
          <Square className="w-4 h-4" /> Stop Scenario
        </button>
      )}
    </div>
  );
}
