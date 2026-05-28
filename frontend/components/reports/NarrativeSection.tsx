"use client";

import { useState } from "react";
import { FormField, FormSection, textareaClass } from "@/components/reports/FormSection";
import type { NarrativeRevision, SupervisorComment } from "@/lib/report-types";
import { Sparkles, MessageSquare, History } from "lucide-react";

interface NarrativeSectionProps {
  narrative: string;
  onChange: (narrative: string) => void;
  revisions?: NarrativeRevision[];
  supervisorComments?: SupervisorComment[];
  disabled?: boolean;
  onAiSuggest?: () => void;
  aiLoading?: boolean;
  onSupervisorComment?: (comment: string) => void;
  isSupervisor?: boolean;
}

const NARRATIVE_TEMPLATES = [
  { label: "Chronological", prefix: "CHRONOLOGICAL NARRATIVE:\n\n" },
  { label: "Officer Observations", prefix: "OFFICER OBSERVATIONS:\n\n" },
  { label: "Witness Statement", prefix: "WITNESS STATEMENT:\n\n" },
  { label: "Supplemental", prefix: "SUPPLEMENTAL NARRATIVE:\n\n" },
];

export function NarrativeSection({
  narrative,
  onChange,
  revisions = [],
  supervisorComments = [],
  disabled,
  onAiSuggest,
  aiLoading,
  onSupervisorComment,
  isSupervisor,
}: NarrativeSectionProps) {
  const insertTemplate = (prefix: string) => {
    onChange(narrative ? `${narrative}\n\n${prefix}` : prefix);
  };

  return (
    <FormSection title="Narrative" subtitle="Rich-text report narrative with revision history">
      {!disabled && (
        <div className="flex flex-wrap gap-2 mb-4">
          {NARRATIVE_TEMPLATES.map(({ label, prefix }) => (
            <button
              key={label}
              type="button"
              onClick={() => insertTemplate(prefix)}
              className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            >
              + {label}
            </button>
          ))}
          {onAiSuggest && (
            <button
              type="button"
              onClick={onAiSuggest}
              disabled={aiLoading}
              className="text-xs px-3 py-1.5 rounded border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading ? "Generating…" : "AI Assist"}
            </button>
          )}
        </div>
      )}

      <FormField label="Report Narrative" required error={!narrative && !disabled ? undefined : undefined}>
        <textarea
          className={textareaClass + " min-h-[240px] font-mono text-sm leading-relaxed"}
          value={narrative}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck
          placeholder="Enter chronological narrative, officer observations, witness statements…"
          readOnly={disabled}
        />
      </FormField>

      {revisions.length > 0 && (
        <div className="mt-4 border-t border-slate-700/40 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            <History className="w-3.5 h-3.5" />
            Timestamped Revisions ({revisions.length})
          </div>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {revisions.slice(-5).reverse().map((rev, i) => (
              <li key={i} className="text-xs text-slate-500 border-l-2 border-slate-700 pl-3">
                <span className="text-slate-400">{rev.created_at ? new Date(rev.created_at).toLocaleString() : "—"}</span>
                {" — "}
                {rev.content.slice(0, 80)}{rev.content.length > 80 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(supervisorComments.length > 0 || (isSupervisor && onSupervisorComment)) && (
        <div className="mt-4 border-t border-slate-700/40 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Supervisor Comments
          </div>
          {supervisorComments.map((c, i) => (
            <div key={i} className="text-sm text-slate-300 bg-slate-800/50 rounded p-3 mb-2 border border-slate-700/40">
              <div className="text-xs text-slate-500 mb-1">{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</div>
              {c.comment}
            </div>
          ))}
          {isSupervisor && onSupervisorComment && !disabled && (
            <SupervisorCommentForm onSubmit={onSupervisorComment} />
          )}
        </div>
      )}
    </FormSection>
  );
}

function SupervisorCommentForm({ onSubmit }: { onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        className="flex-1 px-3 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-md text-slate-100"
        placeholder="Add supervisor comment…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        type="button"
        onClick={() => { if (comment.trim()) { onSubmit(comment.trim()); setComment(""); } }}
        className="px-3 py-2 text-sm rounded-md bg-amber-600/20 text-amber-400 border border-amber-500/30"
      >
        Add
      </button>
    </div>
  );
}
