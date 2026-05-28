"use client";

import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { ExternalReportModal } from "@/components/mdt/ExternalReportModal";
import type { PendingReport } from "@/lib/types";

interface Props {
  reports: PendingReport[];
  onSubmit: (reportId: string, narrative: string) => Promise<void>;
  submittingId?: string | null;
  variant?: "default" | "vehicle";
}

export function ReportWritingPanel({ reports, onSubmit, submittingId, variant = "default" }: Props) {
  const vehicle = variant === "vehicle";
  const btnClass = vehicle ? "mdt-vehicle-btn-sm" : "text-[10px] uppercase tracking-wide py-1.5 rounded";
  const textSize = vehicle ? "text-sm" : "text-xs";
  const headerSize = vehicle ? "text-sm" : "text-xs";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [rmsReport, setRmsReport] = useState<PendingReport | null>(null);

  const handleRmsSubmit = async (reportId: string, narrative: string) => {
    await onSubmit(reportId, narrative);
    setRmsReport(null);
  };

  if (!reports.length) {
    return (
      <div className={clsx("tactical-panel flex flex-col", vehicle ? "p-4" : "p-3")}>
        <h3 className={clsx(headerSize, "uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2 font-bold")}>
          <FileText className={vehicle ? "w-5 h-5" : "w-3 h-3"} /> Report Writing
        </h3>
        <p className={clsx(textSize, "text-slate-600 text-center py-4")}>
          No pending reports — open a case number on an active call to require a report
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={clsx("tactical-panel flex flex-col overflow-hidden", !vehicle && "max-h-72")}>
        <div className={clsx("border-b border-[#2a2a32] flex items-center justify-between gap-2", vehicle ? "p-4" : "p-3")}>
          <h3 className={clsx(headerSize, "uppercase tracking-wider text-slate-500 flex items-center gap-2 shrink-0 font-bold")}>
            <FileText className={vehicle ? "w-5 h-5" : "w-3 h-3"} /> Report Writing
          </h3>
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setRmsReport(reports[0])}
              className={clsx(
                btnClass,
                "flex items-center gap-2 shrink-0 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30",
                !vehicle && "px-2 py-1 rounded",
              )}
              title="Open full Operations Platform report form"
            >
              <ExternalLink className={vehicle ? "w-4 h-4" : "w-3 h-3"} />
              RMS Writer
            </button>
            <span className={clsx("font-mono bg-amber-600/20 text-amber-300 px-2 py-1 rounded shrink-0", vehicle ? "text-sm" : "text-[10px]")}>
              {reports.length} pending
            </span>
          </div>
        </div>
        <div className={clsx("flex-1 overflow-y-auto space-y-3", vehicle ? "p-3" : "p-2 space-y-2")}>
          {reports.map((report) => {
            const open = activeId === report.id;
            const draft = drafts[report.id] ?? report.narrative ?? "";
            const busy = submittingId === report.id;
            return (
              <div key={report.id} className="bg-[#1a1a20] rounded-xl border border-[#2a2a32] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveId(open ? null : report.id)}
                  className={clsx("w-full text-left hover:bg-[#141418] transition-colors", vehicle ? "p-4" : "p-2")}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx("font-mono text-blue-300", vehicle ? "text-base" : "text-xs")}>{report.incident_number}</span>
                    {report.case_number && (
                      <>
                        <span className="text-slate-600">↔</span>
                        <span className={clsx("font-mono text-amber-300", vehicle ? "text-base" : "text-xs")}>{report.case_number}</span>
                      </>
                    )}
                    <span className="text-[10px] text-amber-400 uppercase">Report required</span>
                  </div>
                  {report.case_number && (
                    <p className="text-[10px] text-slate-500 mt-0.5">Linked in RMS — searchable by either number</p>
                  )}
                  <p className={clsx("text-slate-300 truncate mt-1", vehicle ? "text-base" : "text-xs")}>{report.nature}</p>
                  {report.location && (
                    <p className={clsx("text-slate-500 truncate", vehicle ? "text-sm mt-1" : "text-[10px]")}>{report.location}</p>
                  )}
                </button>
                <div className={clsx("flex gap-2", vehicle ? "px-3 pb-3" : "px-2 pb-2 gap-1.5")}>
                  <button
                    type="button"
                    onClick={() => setRmsReport(report)}
                    className={clsx(
                      btnClass,
                      "flex-1 flex items-center justify-center gap-2 bg-[#141418] text-blue-300 hover:bg-blue-600/20 border border-[#2a2a32] hover:border-blue-500/30",
                      !vehicle && "rounded",
                    )}
                  >
                    <ExternalLink className={vehicle ? "w-4 h-4" : "w-3 h-3"} />
                    Pull Ops Platform Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveId(open ? null : report.id)}
                    className={clsx(
                      btnClass,
                      "flex-1 bg-[#141418] text-slate-400 hover:text-slate-200 border border-[#2a2a32]",
                      !vehicle && "rounded",
                    )}
                  >
                    {open ? "Close Quick Write" : "Quick Write"}
                  </button>
                </div>
                {open && (
                  <div className={clsx("border-t border-[#2a2a32] space-y-3", vehicle ? "p-4" : "p-2 space-y-2")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [report.id]: e.target.value }))}
                      rows={vehicle ? 6 : 4}
                      placeholder="Enter incident narrative for RMS submission…"
                      className={clsx(
                        "w-full bg-[#0c0c0e] border border-[#2a2a32] rounded-xl p-3 text-slate-200 resize-none focus:outline-none focus:border-blue-500",
                        vehicle ? "text-base" : "text-xs",
                      )}
                    />
                    <button
                      type="button"
                      disabled={!draft.trim() || busy}
                      onClick={() => onSubmit(report.id, draft.trim())}
                      className={clsx(
                        "w-full text-white flex items-center justify-center gap-2",
                        vehicle ? "mdt-vehicle-btn" : "tactical-btn text-xs",
                        draft.trim() ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-700 opacity-50 cursor-not-allowed",
                      )}
                    >
                      {busy ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Submitting…</>
                      ) : (
                        "Submit Report to RMS"
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ExternalReportModal
        report={rmsReport}
        onClose={() => setRmsReport(null)}
        onSubmit={handleRmsSubmit}
        submitting={!!rmsReport && submittingId === rmsReport.id}
      />
    </>
  );
}
