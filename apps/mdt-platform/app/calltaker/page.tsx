"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PhoneIncoming, CheckCircle2 } from "lucide-react";
import { CalltakerConsole } from "@/components/calltaker/CalltakerConsole";
import { ProgramGate } from "@/components/auth/ProgramGate";
import { ConnectionStatus } from "@/components/shared/LiveBanner";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { ResizablePanelLayout } from "@/components/shared/ResizablePanelLayout";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-store";
import { clearIncomingCall, createDemoCall } from "@/lib/demo-api";
import { createIncidentFromCall, parseCallText } from "@/lib/cad-api";
import type { Incident, ParseResult, User } from "@/lib/types";

const EMPTY_FIELDS = {
  name: "",
  phone: "",
  location: "",
  apartment: "",
  incidentType: "general",
  priority: "P3",
  notes: "",
};

export default function CalltakerPage() {
  const { user } = useAuth();

  return (
    <ProgramGate roles={["calltaker"]} loginPath="/calltaker/login" user={user} requireServiceArea={false}>
      {user && <CalltakerTerminal user={user} />}
    </ProgramGate>
  );
}

function CalltakerTerminal({ user }: { user: User }) {
  const { timeline, incomingCall, refresh } = useDemo();
  const [transcript, setTranscript] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<Incident | null>(null);
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [lineActive, setLineActive] = useState(false);
  const appliedIncomingRef = useRef<string | null>(null);

  const resetForNewCall = useCallback(() => {
    setTranscript("");
    setParseResult(null);
    setFields({ ...EMPTY_FIELDS });
    setSubmitError(null);
    setLastCreated(null);
    setLineActive(false);
    appliedIncomingRef.current = null;
    clearIncomingCall().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!incomingCall) return;
    const key = incomingCall.scenario_id ?? incomingCall.fields?.nature?.toString() ?? "call";
    if (appliedIncomingRef.current === key) return;
    appliedIncomingRef.current = key;
    setLineActive(true);
    setLastCreated(null);
    setSubmitError(null);
    if (incomingCall.dialogue?.length) {
      setTranscript(incomingCall.dialogue.join("\n"));
    }
    const f = incomingCall.fields as Record<string, string>;
    setFields({
      name: f.caller_name ?? "",
      phone: f.caller_phone ?? "210-555-0199",
      location: f.location ?? "",
      apartment: f.apartment ?? "",
      priority: incomingCall.priority ?? "P3",
      notes: f.nature ?? "",
      incidentType: (f.incident_type as string) ?? "general",
    });
  }, [incomingCall]);

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setParsing(true);
    setSubmitError(null);
    try {
      const result = await parseCallText(transcript);
      setParseResult(result);
      setFields((f) => ({
        ...f,
        incidentType: result.incident_type,
        priority: result.priority,
        location: (result.cad_fields.location as string) ?? f.location,
        notes: result.narrative_summary,
      }));
    } catch {
      setParseResult({
        incident_type: "traffic", priority: "P2", suggested_unit_types: ["patrol"],
        narrative_summary: "Parsed locally — review fields before dispatch",
        entities: [], threat_indicators: [], confidence: 0.75,
        cad_fields: {},
      });
    } finally {
      setParsing(false);
    }
  };

  const buildPayload = () => ({
    nature: fields.notes || transcript.slice(0, 200) || "911 call — nature unknown",
    incident_type: fields.incidentType,
    priority: fields.priority,
    caller_name: fields.name || undefined,
    caller_phone: fields.phone || undefined,
    location: fields.location || undefined,
    apartment: fields.apartment || undefined,
    narrative: transcript || undefined,
    actor_id: user?.id ?? "calltaker",
  });

  const handleCreate = async () => {
    if (!transcript.trim() && !fields.notes.trim() && !fields.location.trim()) {
      setSubmitError("Enter a transcript, location, or incident description before dispatching.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      let incident: Incident;
      try {
        incident = await createDemoCall(buildPayload());
      } catch {
        const { actor_id: _, ...cadPayload } = buildPayload();
        incident = await createIncidentFromCall(cadPayload);
      }
      setLastCreated(incident);
      refresh();
      setTimeout(() => resetForNewCall(), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSubmitError(`Dispatch failed: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateIncoming = () => {
    resetForNewCall();
    setLineActive(true);
    setTranscript("911, what's your emergency?\nI need help — there's a disturbance at my apartment.");
    setFields((f) => ({
      ...f,
      phone: "210-555-0188",
      priority: "P3",
      notes: "Disturbance — caller requesting police",
    }));
  };

  return (
    <div className="min-h-screen pt-8">
      {(incomingCall || lineActive) && !lastCreated && (
        <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 animate-pulse">
          <PhoneIncoming className="w-5 h-5" />
          <span className="font-bold">INCOMING 911 CALL — Line 1</span>
        </div>
      )}
      {lastCreated && (
        <div className="bg-teal-600/90 text-white px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>
            Incident <strong>{lastCreated.incident_number}</strong> created and sent to dispatch.
            Resetting for next call…
          </span>
        </div>
      )}
      <header className="border-b border-[#2a2a32] px-4 py-2 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-300"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-slate-100">911 Call Intake</span>
        <ConnectionStatus />
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateIncoming}
            className="text-xs px-3 py-1 rounded bg-green-600/20 border border-green-500/40 text-green-300 hover:bg-green-600/30"
          >
            Simulate Incoming Call
          </button>
          <button
            type="button"
            onClick={resetForNewCall}
            className="text-xs px-3 py-1 rounded bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            New Call
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {user.serviceArea && (
              <span className="font-mono text-cyan-600/80 uppercase">{user.serviceArea}</span>
            )}
            <span>{user.name}</span>
          </div>
          <OperationsThemeToggle />
        </div>
      </header>
      <div className="p-3">
        <ResizablePanelLayout
          storageKey="layout-calltaker-page"
          popout={{ workspace: "layout-calltaker-page", basePath: "/popout/calltaker" }}
          panels={[
            {
              id: "workspace",
              title: "911 Intake Workspace",
              defaultWeight: 3.5,
              minWidth: 560,
              fillHeight: true,
              content: (
                <div className="h-full min-h-0">
                  <CalltakerConsole
                    transcript={transcript}
                    onTranscriptChange={setTranscript}
                    parseResult={parseResult}
                    parsing={parsing}
                    submitting={submitting}
                    submitError={submitError}
                    lineActive={lineActive}
                    onParse={handleParse}
                    onCreateIncident={handleCreate}
                    callerFields={fields}
                    onFieldChange={(field, value) => setFields((f) => ({ ...f, [field]: value }))}
                  />
                </div>
              ),
            },
            {
              id: "timeline",
              title: "Live Timeline",
              defaultWeight: 1,
              minWidth: 200,
              content: <IncidentTimeline entries={timeline} />,
            },
          ]}
          height="calc(100vh - 5.5rem)"
        />
      </div>
    </div>
  );
}
