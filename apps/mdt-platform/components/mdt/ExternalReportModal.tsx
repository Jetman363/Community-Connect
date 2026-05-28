"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronRight, ExternalLink, FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { fetchReportLayout } from "@/lib/demo-api";
import type { ExternalReportLayout, PendingReport, ReportLayoutField, ReportLayoutSection } from "@/lib/types";

interface Props {
  report: PendingReport | null;
  onClose: () => void;
  onSubmit: (reportId: string, narrative: string) => Promise<void>;
  submitting?: boolean;
}

type SectionEntries = Record<string, Record<string, string>[]>;

function cloneEntries(layout: ExternalReportLayout): SectionEntries {
  const out: SectionEntries = {};
  for (const section of layout.sections) {
    out[section.id] = section.entries.map((entry) => ({ ...entry }));
  }
  return out;
}

function emptyEntry(section: ReportLayoutSection): Record<string, string> {
  const entry: Record<string, string> = {};
  for (const field of section.fields) {
    if (field.type === "checkbox") entry[field.id] = "false";
    else if (field.type === "yes_no") entry[field.id] = "";
    else entry[field.id] = field.default ?? "";
  }
  return entry;
}

function formatValue(field: ReportLayoutField, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "false") return null;
  if (field.type === "checkbox") return "Yes";
  if (field.type === "yes_no") return trimmed === "true" ? "Yes" : trimmed === "false" ? "No" : trimmed;
  return trimmed;
}

function layoutToNarrative(layout: ExternalReportLayout, entriesBySection: SectionEntries): string {
  const parts: string[] = [];
  for (const section of layout.sections) {
    const entries = entriesBySection[section.id] ?? [];
    const sectionBlocks: string[] = [];

    entries.forEach((entry, index) => {
      const lines: string[] = [];
      for (const field of section.fields) {
        const formatted = formatValue(field, entry[field.id] ?? "");
        if (formatted) lines.push(`${field.label}: ${formatted}`);
      }
      if (lines.length) {
        const label = section.repeatable
          ? `${section.entry_label ?? "Entry"} ${index + 1}`
          : section.title;
        sectionBlocks.push(`[${label}]\n${lines.join("\n")}`);
      }
    });

    if (sectionBlocks.length) {
      parts.push(`== ${section.title} ==\n${sectionBlocks.join("\n\n")}`);
    }
  }
  return parts.join("\n\n");
}

function FieldInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: ReportLayoutField;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) {
  const base =
    "w-full bg-[#0c0c0e] border border-[#2a2a32] rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500";
  const locked = readOnly ? " opacity-80 cursor-not-allowed bg-[#141418]" : "";

  if (readOnly && field.type !== "checkbox") {
    return (
      <input
        type="text"
        value={value}
        readOnly
        className={clsx(base, locked)}
        title="Linked in RMS — read only"
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={field.placeholder}
        className={clsx(base, "resize-none")}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">— Select —</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "yes_no") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={value === "true"}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
          className="rounded border-[#2a2a32]"
        />
        {field.label}
      </label>
    );
  }

  const inputType =
    field.type === "date" || field.type === "time" || field.type === "tel" || field.type === "email"
      ? field.type
      : "text";

  return (
    <input
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={base}
    />
  );
}

function SectionPanel({
  section,
  entries,
  onChange,
  defaultOpen,
  lockedFieldIds,
}: {
  section: ReportLayoutSection;
  entries: Record<string, string>[];
  onChange: (entries: Record<string, string>[]) => void;
  defaultOpen: boolean;
  lockedFieldIds?: Set<string>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const minEntries = section.min_entries ?? 0;

  const updateField = (entryIndex: number, fieldId: string, value: string) => {
    const next = entries.map((entry, i) => (i === entryIndex ? { ...entry, [fieldId]: value } : entry));
    onChange(next);
  };

  const addEntry = () => onChange([...entries, emptyEntry(section)]);
  const removeEntry = (index: number) => {
    if (entries.length <= minEntries) return;
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <section className="bg-[#1a1a20] rounded border border-[#2a2a32] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 border-b border-[#2a2a32] flex items-center gap-2 hover:bg-[#141418] transition-colors text-left"
      >
        {open ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
        <FileText className="w-3 h-3 text-slate-500" />
        <div className="min-w-0 flex-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">{section.title}</h3>
          {section.subtitle && <p className="text-[10px] text-slate-600 truncate">{section.subtitle}</p>}
        </div>
        {section.repeatable && entries.length > 0 && (
          <span className="text-[10px] font-mono bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">
            {entries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="p-3 space-y-3">
          {entries.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-2">No entries — add one if applicable.</p>
          )}

          {entries.map((entry, entryIndex) => (
            <div key={entryIndex} className="rounded border border-[#2a2a32] bg-[#121218] overflow-hidden">
              {section.repeatable && (
                <div className="px-3 py-1.5 border-b border-[#2a2a32] flex items-center justify-between bg-[#0c0c0e]">
                  <span className="text-[10px] uppercase text-slate-500">
                    {section.entry_label ?? "Entry"} {entryIndex + 1}
                  </span>
                  {entries.length > minEntries && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entryIndex)}
                      className="text-slate-600 hover:text-red-400 p-0.5"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-3 grid grid-cols-2 gap-3">
                {section.fields.map((field) => (
                  <div
                    key={field.id}
                    className={clsx(
                      "space-y-1",
                      (field.span === 2 || field.type === "checkbox") && "col-span-2",
                    )}
                  >
                    {field.type !== "checkbox" && (
                      <label className="text-[10px] uppercase text-slate-500">
                        {field.label}
                        {field.required && <span className="text-amber-400 ml-0.5">*</span>}
                      </label>
                    )}
                    <FieldInput
                      field={field}
                      value={entry[field.id] ?? ""}
                      onChange={(val) => updateField(entryIndex, field.id, val)}
                      readOnly={lockedFieldIds?.has(field.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {section.repeatable && section.add_label && (
            <button
              type="button"
              onClick={addEntry}
              className="w-full text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 py-2 rounded border border-dashed border-[#2a2a32] text-blue-300 hover:bg-blue-600/10 hover:border-blue-500/30"
            >
              <Plus className="w-3 h-3" />
              {section.add_label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function ExternalReportModal({ report, onClose, onSubmit, submitting }: Props) {
  const [layout, setLayout] = useState<ExternalReportLayout | null>(null);
  const [entriesBySection, setEntriesBySection] = useState<SectionEntries>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLayout = useCallback(async (reportId: string) => {
    setLoading(true);
    setError(null);
    setLayout(null);
    try {
      const data = await fetchReportLayout(reportId);
      setLayout(data);
      setEntriesBySection(cloneEntries(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pull report layout from Operations Platform");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (report) loadLayout(report.id);
    else {
      setLayout(null);
      setEntriesBySection({});
      setError(null);
    }
  }, [report, loadLayout]);

  const missingRequired = useMemo(() => {
    if (!layout) return [] as string[];
    const missing: string[] = [];
    for (const section of layout.sections) {
      const entries = entriesBySection[section.id] ?? [];
      for (const field of section.fields) {
        if (!field.required) continue;
        const hasValue = entries.some((entry) => (entry[field.id] ?? "").trim());
        if (!hasValue) missing.push(`${section.title}: ${field.label}`);
      }
    }
    return missing;
  }, [layout, entriesBySection]);

  const lockedFieldIds = useMemo(() => {
    if (!layout?.rms_link?.linked) return undefined;
    return new Set(["incident_number", "case_number"]);
  }, [layout]);

  const displayIncident = layout?.incident_number ?? report?.incident_number;
  const displayCase = layout?.case_number ?? report?.case_number;

  const handleSubmit = async () => {
    if (!layout || !report || missingRequired.length) return;
    const narrative = layoutToNarrative(layout, entriesBySection);
    await onSubmit(report.id, narrative);
  };

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="tactical-panel w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#2a2a32] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ExternalLink className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-slate-100 truncate">Operations Platform — Report Writer</h2>
              <p className="text-[10px] text-slate-500 truncate">
                {displayCase ? (
                  <>
                    <span className="font-mono text-amber-300">{displayCase}</span>
                    <span className="text-slate-600 mx-1">↔</span>
                    <span className="font-mono text-blue-300">{displayIncident}</span>
                  </>
                ) : (
                  displayIncident
                )}
                {" · "}{report.nature}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <p className="text-sm">Pulling full report layout from Operations Platform…</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => loadLayout(report.id)}
              className="tactical-btn bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5"
            >
              Retry
            </button>
          </div>
        )}

        {layout && !loading && (
          <>
            {layout.rms_link?.linked && layout.case_number && layout.incident_number && (
              <div className="px-4 py-2 border-b border-indigo-500/30 bg-indigo-600/10 text-[10px] text-indigo-200">
                RMS linked record — Case{" "}
                <span className="font-mono font-semibold text-amber-300">{layout.case_number}</span>
                {" "}is tied to CAD Incident{" "}
                <span className="font-mono font-semibold text-blue-300">{layout.incident_number}</span>
                . Both numbers are prefilled from RMS and cannot be changed here.
              </div>
            )}
            <div className="px-4 py-2 border-b border-[#2a2a32] bg-[#121218] flex flex-wrap items-center gap-2 text-[10px]">
              <span className="font-mono text-blue-300">{layout.source_system}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{layout.template_name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">v{layout.template_version}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{layout.sections.length} sections</span>
              <span className="ml-auto text-slate-600">
                Prefilled: {layout.prefilled_from.join(", ")}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {layout.sections.map((section) => (
                <SectionPanel
                  key={section.id}
                  section={section}
                  entries={entriesBySection[section.id] ?? []}
                  onChange={(entries) =>
                    setEntriesBySection((prev) => ({ ...prev, [section.id]: entries }))
                  }
                  defaultOpen={section.default_open ?? true}
                  lockedFieldIds={section.id === "header" ? lockedFieldIds : undefined}
                />
              ))}
            </div>

            <div className="p-4 border-t border-[#2a2a32] shrink-0 space-y-2">
              {missingRequired.length > 0 && (
                <p className="text-[10px] text-amber-400 line-clamp-2">
                  Required: {missingRequired.join(" · ")}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 tactical-btn bg-[#2a2a32] hover:bg-[#3a3a42] text-slate-300 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!missingRequired.length || submitting}
                  onClick={handleSubmit}
                  className={clsx(
                    "flex-1 tactical-btn text-white text-xs py-2 flex items-center justify-center gap-1",
                    missingRequired.length || submitting
                      ? "bg-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500",
                  )}
                >
                  {submitting ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit to RMS"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
