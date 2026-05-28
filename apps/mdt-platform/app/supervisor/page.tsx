"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupervisorDashboard } from "@/components/supervisor/SupervisorDashboard";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { DemoControlPanel } from "@/components/shared/DemoControlPanel";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { addSupervisorNote } from "@/lib/demo-api";
import { fetchIncidents, fetchUnits } from "@/lib/cad-api";
import type { Incident, Unit, User } from "@/lib/types";

export default function SupervisorPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["supervisor", "admin"]} loginPath="/supervisor/login" user={user}>
      {user && <SupervisorTerminal user={user} />}
    </ProgramGate>
  );
}

function SupervisorTerminal({ user }: { user: User }) {
  const { timeline, messages, refresh } = useDemo();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);

  const load = useCallback(async () => {
    try {
      const [incs, uns] = await Promise.all([fetchIncidents(), fetchUnits()]);
      setIncidents(incs);
      setUnits(uns);
    } catch { /* fallback */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEscalate = async (incidentId: string) => {
    await addSupervisorNote(incidentId, "Supervisor escalated incident — additional resources authorized", user.id);
    refresh();
    load();
  };

  return (
    <div className="min-h-screen pt-8">
      <header className="border-b border-[#2a2a32] px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-slate-100">Supervisor Command</span>
        <ConnectionStatus />
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          {user.serviceArea && (
            <span className="font-mono text-cyan-600/80 uppercase">{user.serviceArea}</span>
          )}
          <span>{user.name}</span>
          <OperationsThemeToggle />
        </div>
      </header>
      <div className="p-3 grid grid-cols-12 gap-3">
        <div className="col-span-9">
          <SupervisorDashboard
            incidents={incidents}
            units={units}
            timeline={timeline}
            messages={messages}
            onEscalate={handleEscalate}
            onSelectIncident={setSelected}
            selectedIncident={selected}
          />
        </div>
        <div className="col-span-3">
          <DemoControlPanel />
        </div>
      </div>
    </div>
  );
}
