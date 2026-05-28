"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { AlertTriangle, Brain, Loader2, MapPin, Phone, Sparkles } from "lucide-react";
import { TacticalMapLazy } from "@/components/map/TacticalMapLazy";
import { ResizablePanelLayout } from "@/components/shared/ResizablePanelLayout";
import type { MapMarker } from "@/lib/map-types";
import { useGeocode } from "@/lib/use-geocode";
import type { ParseResult } from "@/lib/types";

interface Props {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  parseResult: ParseResult | null;
  parsing: boolean;
  submitting?: boolean;
  submitError?: string | null;
  lineActive?: boolean;
  onParse: () => void;
  onCreateIncident: () => void;
  callerFields: {
    name: string; phone: string; location: string; apartment: string;
    incidentType: string; priority: string; notes: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function CalltakerConsole({
  transcript, onTranscriptChange, parseResult, parsing, submitting, submitError, lineActive,
  onParse, onCreateIncident, callerFields, onFieldChange,
}: Props) {
  const canSubmit = !submitting && (transcript.trim() || callerFields.notes.trim() || callerFields.location.trim());
  const geocode = useGeocode(callerFields.location);
  const mapMarkers = useMemo((): MapMarker[] => {
    if (!geocode) return [];
    return [{
      id: "call-plot",
      lat: geocode.lat,
      lng: geocode.lng,
      kind: "call",
      label: geocode.placeName,
    }];
  }, [geocode]);

  const panels = useMemo(
    () => [
      {
        id: "caller",
        title: "Line 1 — Caller / ALI",
        defaultWeight: 1.3,
        minWidth: 220,
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className={clsx("w-5 h-5", lineActive ? "text-green-500 animate-pulse" : "text-slate-600")} />
              <span className="font-semibold text-slate-200">
                {lineActive ? "Active Call" : "Ready"}
              </span>
              <span className={clsx(
                "ml-auto text-xs font-mono px-2 py-0.5 rounded",
                lineActive ? "bg-green-600/20 text-green-400" : "bg-slate-800 text-slate-500",
              )}>
                {lineActive ? "CONNECTED" : "IDLE"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <InputField label="Caller Name" value={callerFields.name} onChange={(v) => onFieldChange("name", v)} disabled={submitting} />
              <InputField label="Phone / ANI" value={callerFields.phone} onChange={(v) => onFieldChange("phone", v)} disabled={submitting} />
              <InputField label="Location (ALI)" value={callerFields.location} onChange={(v) => onFieldChange("location", v)} className="col-span-2" disabled={submitting} />
              <InputField label="Apt / Unit" value={callerFields.apartment} onChange={(v) => onFieldChange("apartment", v)} disabled={submitting} />
              <SelectField label="Priority" value={callerFields.priority} onChange={(v) => onFieldChange("priority", v)} options={["P1", "P2", "P3", "P4", "P5"]} disabled={submitting} />
            </div>
          </div>
        ),
      },
      {
        id: "transcript",
        title: "Live Transcript",
        defaultWeight: 1.4,
        minWidth: 240,
        fillHeight: true,
        content: (
          <div className="flex h-full min-h-[12rem] flex-col">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs uppercase tracking-wider text-slate-500">Speech-to-text</span>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              disabled={submitting}
              className="min-h-0 flex-1 resize-none rounded border border-[#2a2a32] bg-[#1a1a20] p-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Caller speech appears here via speech-to-text, or click Simulate Incoming Call..."
            />
            <button
              type="button"
              onClick={onParse}
              disabled={parsing || submitting || !transcript.trim()}
              className="tactical-btn mt-2 flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {parsing ? "Parsing..." : "AI Parse & Auto-Fill"}
            </button>
          </div>
        ),
      },
      {
        id: "ai",
        title: "AI Extraction",
        defaultWeight: 1.1,
        minWidth: 200,
        content: parseResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-green-400">{(parseResult.confidence * 100).toFixed(0)}% confidence</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <ResultField label="Incident Type" value={parseResult.incident_type} />
              <ResultField label="Priority" value={parseResult.priority} highlight />
              <ResultField label="Dispatch Code" value={parseResult.dispatch_code ?? "—"} />
              <ResultField label="Units" value={parseResult.suggested_unit_types.join(", ")} />
            </div>
            <p className="rounded bg-[#1a1a20] p-2 text-sm text-slate-300">{parseResult.narrative_summary}</p>
            {parseResult.threat_indicators.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {parseResult.threat_indicators.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded bg-red-600/20 px-2 py-0.5 text-xs text-red-300">
                    <AlertTriangle className="w-3 h-3" /> {t.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-slate-600">Run AI parse to see extraction results</p>
        ),
      },
      {
        id: "cad",
        title: "CAD Dispatch",
        defaultWeight: 1.2,
        minWidth: 220,
        fillHeight: true,
        content: (
          <div className="flex h-full min-h-[12rem] flex-col text-sm">
            <SelectField
              label="Incident Type"
              value={callerFields.incidentType}
              onChange={(v) => onFieldChange("incidentType", v)}
              options={["general", "traffic", "medical", "burglary", "domestic_violence", "disturbance", "pursuit", "officer_emergency"]}
              disabled={submitting}
            />
            <div className="mt-2 min-h-0 flex-1">
              <InputField label="Notes / Narrative" value={callerFields.notes} onChange={(v) => onFieldChange("notes", v)} disabled={submitting} multiline />
            </div>
            {submitError && (
              <p className="mt-2 rounded border border-red-500/30 bg-red-600/10 p-2 text-xs text-red-400">{submitError}</p>
            )}
            <button
              type="button"
              onClick={onCreateIncident}
              disabled={!canSubmit}
              className="tactical-btn mt-3 flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching...</>
              ) : (
                "Create Incident & Dispatch"
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              Submits to CAD, notifies dispatch & supervisor, then clears for next call
            </p>
          </div>
        ),
      },
      {
        id: "gis",
        title: "GIS Plot",
        defaultWeight: 1,
        minWidth: 200,
        fillHeight: true,
        content: (
          <div className="flex h-full min-h-[10rem] flex-col">
            <TacticalMapLazy
              markers={mapMarkers}
              center={geocode ? [geocode.lng, geocode.lat] : undefined}
              zoom={15}
              height="100%"
              className="min-h-[140px] flex-1"
              fitToMarkers={mapMarkers.length > 0}
            />
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <p className="truncate text-slate-400" title={callerFields.location}>
                {geocode?.placeName ?? (callerFields.location || "Enter location to plot ALI")}
              </p>
              <p>ANI/ALI: {callerFields.phone ? "Auto-ingested" : "Waiting"}</p>
              <p>Text-to-911: Supported</p>
            </div>
          </div>
        ),
      },
    ],
    [
      lineActive,
      callerFields,
      submitting,
      onFieldChange,
      transcript,
      onTranscriptChange,
      parsing,
      onParse,
      parseResult,
      submitError,
      canSubmit,
      onCreateIncident,
      mapMarkers,
      geocode,
    ],
  );

  return (
    <ResizablePanelLayout
      storageKey="layout-calltaker-console"
      panels={panels}
      height="100%"
      className="h-full min-h-0"
    />
  );
}

function InputField({
  label, value, onChange, className, disabled, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void; className?: string; disabled?: boolean; multiline?: boolean;
}) {
  return (
    <div className={clsx(className, multiline && "flex h-full flex-col")}>
      <label className="text-[10px] uppercase text-slate-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 min-h-0 flex-1 resize-none rounded border border-[#2a2a32] bg-[#1a1a20] px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full rounded border border-[#2a2a32] bg-[#1a1a20] px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      )}
    </div>
  );
}

function SelectField({
  label, value, onChange, options, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded border border-[#2a2a32] bg-[#1a1a20] px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
        ))}
      </select>
    </div>
  );
}

function ResultField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-slate-500">{label}</p>
      <p className={clsx("font-medium", highlight ? "text-orange-300" : "text-slate-200")}>{value}</p>
    </div>
  );
}
