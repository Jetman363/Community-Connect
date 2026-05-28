"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sparkles, CheckCircle, Clock, FileText, Mic } from "lucide-react";

const SAMPLE_NOTES = `Traffic stop 0915 hrs N Main St. Honda Accord, expired tags. Driver: male, 34, nervous. Odor of marijuana. Consent search - found baggie with crystal substance, digital scale, $2340 cash. FST not required. Arrested for PCS Sch II. Transported to Central Booking. Evidence bagged and logged.`;

const GENERATED_NARRATIVE = `On May 27, 2026, at approximately 0915 hours, I, Detective Sarah Mitchell (Badge #2847), was on patrol in the 1200 block of North Main Street when I observed a 2019 Honda Accord displaying expired registration tags.

I initiated a traffic stop and made contact with the driver, later identified as Marcus J. Webb (DOB: 03/14/1992). Upon approach, I detected a strong odor of marijuana emanating from the vehicle interior. Mr. Webb exhibited signs of nervousness including elevated speech rate and avoidant eye contact.

After obtaining verbal consent to search the vehicle, I located a clear plastic baggie containing approximately 14.2 grams of a crystalline substance consistent with methamphetamine, a digital scale, and $2,340.00 in U.S. currency in the center console. The substance field-tested presumptive positive for methamphetamine.

Mr. Webb was placed under arrest for Possession of a Controlled Substance Schedule II (720 ILCS 570/402) without incident. He was transported to Central Booking Facility and all evidence was collected, photographed, and entered into evidence per department policy EV-2024-003.

This report was generated with AI assistance and requires officer review before finalization.`;

export default function AIReportPage() {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [narrative, setNarrative] = useState("");
  const [generating, setGenerating] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setNarrative(GENERATED_NARRATIVE);
      setGenerating(false);
    }, 1500);
  };

  return (
    <AppShell title="AI Report Writer" subtitle="Generate police narratives with human-in-the-loop approval">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Field Notes / Input</span>
            </div>
            <button className="btn-secondary text-xs flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Transcribe
            </button>
          </div>
          <div className="p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={12}
              className="input-field font-mono text-xs leading-relaxed resize-none"
              placeholder="Enter field notes, body cam transcript excerpt, or incident details…"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">{notes.length} characters</span>
              <button onClick={handleGenerate} disabled={generating || !notes.trim()} className="btn-primary flex items-center gap-2 text-sm">
                {generating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? "Generating…" : "Generate Narrative"}
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">AI-Generated Draft</span>
            </div>
            {narrative && !approved && (
              <span className="badge text-amber-400 bg-amber-500/15 border-amber-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending Review
              </span>
            )}
            {approved && (
              <span className="badge text-emerald-400 bg-emerald-500/15 border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Approved
              </span>
            )}
          </div>
          <div className="p-4">
            {narrative ? (
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={12}
                className="input-field text-sm leading-relaxed resize-none"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-600 text-sm">
                Generated narrative will appear here for officer review and editing
              </div>
            )}
            {narrative && !approved && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setApproved(true)} className="btn-primary text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Approve & Submit
                </button>
                <button onClick={handleGenerate} className="btn-secondary text-sm">
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="text-sm font-medium text-white">Report Metadata</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 mb-1">Report ID</div>
            <div className="font-mono text-cyan-400">RPT-2026-112847</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Case Number</div>
            <div className="font-mono text-slate-300">MC-2026-0892</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Incident Type</div>
            <div className="text-slate-300">Traffic Stop – Narcotics</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">AI Model</div>
            <div className="text-slate-300">Claude (Human Review Required)</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-400/80">
          <strong>Policy Notice:</strong> All AI-generated narratives require officer review and explicit approval
          before finalization. AI output is logged in the immutable audit trail per CJIS AI governance policy.
        </p>
      </div>
    </AppShell>
  );
}
