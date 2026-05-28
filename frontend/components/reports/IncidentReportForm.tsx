"use client";

import { useCallback, useMemo, useState } from "react";
import { HeaderSection } from "@/components/reports/HeaderSection";
import { VictimsSection } from "@/components/reports/VictimsSection";
import { SuspectsSection } from "@/components/reports/SuspectsSection";
import { VehiclesSection } from "@/components/reports/VehiclesSection";
import { WeaponsSection } from "@/components/reports/WeaponsSection";
import { PropertySection } from "@/components/reports/PropertySection";
import { NarcoticsSection } from "@/components/reports/NarcoticsSection";
import { NarrativeSection } from "@/components/reports/NarrativeSection";
import { useAutosaveReport } from "@/hooks/useAutosaveReport";
import { reportsApi } from "@/lib/reports-api";
import {
  emptyReportForm,
  REQUIRED_HEADER_FIELDS,
  type IncidentReport,
  type IncidentReportFormData,
  type ReportHeader,
} from "@/lib/report-types";
import { cn } from "@/lib/utils";
import {
  Save,
  Send,
  ShieldCheck,
  Lock,
  Download,
  Clock,
  AlertTriangle,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  finalized: "Finalized",
  locked: "Locked",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  pending_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  finalized: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  locked: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface IncidentReportFormProps {
  token: string;
  agencyId: string;
  officerName?: string;
  initialReport?: IncidentReport;
  isSupervisor?: boolean;
  isAdmin?: boolean;
  onCreated?: (report: IncidentReport) => void;
}

function reportToForm(report: IncidentReport): IncidentReportFormData {
  return {
    header: report.header,
    victims: report.victims,
    suspects: report.suspects,
    vehicles: report.vehicles,
    weapons: report.weapons,
    narcotics: report.narcotics,
    property_items: report.property_items,
    narrative: report.narrative ?? "",
  };
}

export function IncidentReportForm({
  token,
  agencyId,
  officerName,
  initialReport,
  isSupervisor,
  isAdmin,
  onCreated,
}: IncidentReportFormProps) {
  const [reportId, setReportId] = useState<string | null>(initialReport?.id ?? null);
  const [status, setStatus] = useState(initialReport?.status ?? "draft");
  const [editable, setEditable] = useState(initialReport?.editable ?? true);
  const [cjiAuthorized, setCjiAuthorized] = useState(initialReport?.cji_authorized ?? true);
  const [form, setForm] = useState<IncidentReportFormData>(
    initialReport ? reportToForm(initialReport) : emptyReportForm(officerName)
  );
  const [revisions, setRevisions] = useState(initialReport?.narrative_revisions ?? []);
  const [supervisorComments, setSupervisorComments] = useState(initialReport?.supervisor_comments ?? []);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headerErrors = useMemo(() => {
    const errs: Partial<Record<keyof ReportHeader, string>> = {};
    for (const key of REQUIRED_HEADER_FIELDS) {
      const val = form.header[key];
      if (!val || (typeof val === "string" && !val.trim())) {
        errs[key] = "Required field";
      }
    }
    return errs;
  }, [form.header]);

  const hasValidationErrors = Object.keys(headerErrors).length > 0;

  const { save: autosave, saving: autosaving, lastSaved } = useAutosaveReport({
    reportId,
    token,
    data: form,
    enabled: editable && !!reportId,
    onError: (e) => setError(e.message),
  });

  const updateForm = useCallback((patch: Partial<IncidentReportFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await reportsApi.create(token, agencyId, form);
      setReportId(created.id);
      setStatus(created.status);
      setEditable(created.editable);
      setCjiAuthorized(created.cji_authorized);
      onCreated?.(created);
      setMessage("Report created successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create report");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!reportId) {
      await handleCreate();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await reportsApi.update(token, reportId, form);
      setStatus(updated.status);
      setEditable(updated.editable);
      setRevisions(updated.narrative_revisions);
      setMessage("Report saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!reportId) return;
    if (hasValidationErrors) {
      setError("Complete required header fields before finalizing");
      return;
    }
    await handleSave();
    try {
      const updated = await reportsApi.finalize(token, reportId);
      setStatus(updated.status);
      setEditable(updated.editable);
      setMessage("Report submitted for supervisor review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Finalize failed");
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!reportId) return;
    try {
      const updated = await reportsApi.approve(token, reportId, approved);
      setStatus(updated.status);
      setEditable(updated.editable);
      setSupervisorComments(updated.supervisor_comments);
      setMessage(approved ? "Report approved" : "Report returned to draft");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    }
  };

  const handleExport = async () => {
    if (!reportId) return;
    try {
      const data = await reportsApi.exportPdf(token, reportId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-report-${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const draft = await reportsApi.aiDraft(token, {
        agency_id: agencyId,
        officer_id: form.header.reporting_officer_id,
        incident_type: form.header.incident_type,
        location: form.header.incident_location,
        notes: form.narrative,
      });
      const text = draft.narrative ?? draft.draft ?? "";
      if (text) {
        updateForm({ narrative: form.narrative ? `${form.narrative}\n\n${text}` : text });
      }
    } catch {
      updateForm({
        narrative: form.narrative +
          "\n\n[AI Draft — configure report-assistant service for live suggestions]\n" +
          "Upon arrival at scene, reporting officer observed…",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const disabled = !editable;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 p-4 rounded-lg bg-[#0d1321]/95 border border-slate-700/60 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-white truncate">
              {form.header.incident_number ? `Incident #${form.header.incident_number}` : "New Incident Report"}
            </h1>
            <span className={cn("text-xs px-2 py-0.5 rounded border", STATUS_COLORS[status] ?? STATUS_COLORS.draft)}>
              {STATUS_LABELS[status] ?? status}
            </span>
            {reportId && (
              <span className="text-xs text-slate-500 font-mono">{reportId.slice(0, 8)}…</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Autosaved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {autosaving && <span className="text-cyan-400">Saving…</span>}
            <span className="flex items-center gap-1 text-amber-500/80">
              <ShieldCheck className="w-3 h-3" />
              CJIS Session — CJI fields encrypted at rest
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {editable && (
            <>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {reportId ? "Save" : "Create Draft"}
              </button>
              {reportId && (
                <button
                  type="button"
                  onClick={() => void autosave()}
                  className="px-3 py-2 text-sm rounded-md border border-slate-600 text-slate-400 hover:text-slate-200"
                >
                  Save Now
                </button>
              )}
            </>
          )}
          {editable && reportId && status === "draft" && (
            <button
              type="button"
              onClick={() => void handleFinalize()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
            >
              <Send className="w-4 h-4" />
              Submit for Review
            </button>
          )}
          {isSupervisor && reportId && status === "pending_review" && (
            <>
              <button type="button" onClick={() => void handleApprove(true)} className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-500">
                Approve
              </button>
              <button type="button" onClick={() => void handleApprove(false)} className="px-3 py-2 text-sm rounded-md bg-amber-600/80 text-white hover:bg-amber-500">
                Return to Draft
              </button>
            </>
          )}
          {reportId && (
            <button type="button" onClick={() => void handleExport()} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-slate-600 text-slate-400 hover:text-slate-200">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-4 py-2">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {hasValidationErrors && editable && (
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-2">
          Required header fields missing — complete before submitting for review.
        </div>
      )}
      {disabled && (
        <div className="text-sm text-slate-400 bg-slate-800/50 border border-slate-700 rounded-md px-4 py-2 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          This report is read-only. Contact a supervisor or administrator to make changes.
        </div>
      )}

      <HeaderSection
        header={form.header}
        onChange={(header) => updateForm({ header })}
        disabled={disabled}
        errors={headerErrors}
      />
      <VictimsSection
        victims={form.victims}
        onChange={(victims) => updateForm({ victims })}
        disabled={disabled}
        cjiRestricted={!cjiAuthorized}
      />
      <SuspectsSection suspects={form.suspects} onChange={(suspects) => updateForm({ suspects })} disabled={disabled} />
      <VehiclesSection vehicles={form.vehicles} onChange={(vehicles) => updateForm({ vehicles })} disabled={disabled} />
      <WeaponsSection weapons={form.weapons} onChange={(weapons) => updateForm({ weapons })} disabled={disabled} />
      <PropertySection propertyItems={form.property_items} onChange={(property_items) => updateForm({ property_items })} disabled={disabled} />
      <NarcoticsSection narcotics={form.narcotics} onChange={(narcotics) => updateForm({ narcotics })} disabled={disabled} />
      <NarrativeSection
        narrative={form.narrative}
        onChange={(narrative) => updateForm({ narrative })}
        revisions={revisions}
        supervisorComments={supervisorComments}
        disabled={disabled}
        onAiSuggest={editable ? handleAiSuggest : undefined}
        aiLoading={aiLoading}
        isSupervisor={isSupervisor}
        onSupervisorComment={
          isSupervisor && reportId
            ? (comment) => void reportsApi.approve(token, reportId, true, comment).then((r) => setSupervisorComments(r.supervisor_comments))
            : undefined
        }
      />
    </div>
  );
}
