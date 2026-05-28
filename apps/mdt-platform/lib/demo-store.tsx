"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchMessages, fetchTimeline, getDemoStatus, listScenarios } from "./demo-api";
import type { CadEvent, DemoMessage, DemoScenario, IncomingCall, TimelineEntry } from "./types";
import { useCadWebSocket } from "./use-cad-websocket";
import { useAuth } from "./auth-context";

interface DemoContextValue {
  demoMode: boolean;
  connected: boolean;
  timeline: TimelineEntry[];
  messages: DemoMessage[];
  scenarios: DemoScenario[];
  activeScenario: Record<string, unknown> | null;
  incomingCall: IncomingCall | null;
  lastEvent: CadEvent | null;
  liveBanner: string | null;
  refresh: () => void;
  onEvent: (event: CadEvent) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const EVENT_BANNERS: Record<string, string> = {
  new_call_created: "NEW 911 CALL",
  cad_event_created: "CAD EVENT CREATED",
  unit_assigned: "UNIT ASSIGNED",
  officer_enroute: "OFFICER EN ROUTE",
  officer_onscene: "OFFICER ON SCENE",
  incident_escalated: "INCIDENT ESCALATED",
  officer_request_backup: "OFFICER NEEDS BACKUP",
  scenario_started: "DEMO SCENARIO STARTED",
  message_sent: "NEW MESSAGE",
  report_completed: "RMS CASE CREATED",
  report_required: "REPORT REQUIRED",
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<Record<string, unknown> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [status, tl, msgs, sc] = await Promise.all([
        getDemoStatus(),
        fetchTimeline(),
        fetchMessages(),
        listScenarios(),
      ]);
      setDemoMode(status.demo_mode);
      setTimeline(dedupeById(tl));
      setMessages(dedupeById(msgs));
      setScenarios(sc);
      setActiveScenario(status.active_scenario as Record<string, unknown> | null);
      setIncomingCall(status.incoming_call as IncomingCall | null);
    } catch { /* demo orchestrator offline */ }
  }, []);

  const handleEvent = useCallback((event: CadEvent) => {
    const banner = EVENT_BANNERS[event.type];
    if (banner) {
      setLiveBanner(banner);
      setTimeout(() => setLiveBanner(null), 4000);
    }
    if (event.type === "incoming_call" && event.call) setIncomingCall(event.call as IncomingCall);
    if (event.type === "scenario_started") setActiveScenario({ id: event.scenario_id, name: event.name, status: "running" });
    if (event.type === "scenario_completed") setActiveScenario(null);
    refresh();
  }, [refresh]);

  const { connected, lastEvent } = useCadWebSocket(token, handleEvent);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <DemoContext.Provider value={{
      demoMode, connected, timeline, messages, scenarios, activeScenario,
      incomingCall, lastEvent, liveBanner, refresh, onEvent: handleEvent,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
