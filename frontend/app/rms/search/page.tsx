"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportStatusBadge } from "@/components/ui/DataDisplay";
import { REPORTS } from "@/lib/mock-data";
import { formatDateTime, cn } from "@/lib/utils";
import { Search, Filter, FileText } from "lucide-react";

export default function RMSSearchPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState(REPORTS[0]);

  const filtered = useMemo(() => {
    return REPORTS.filter((r) => {
      const matchesQuery =
        !query ||
        r.incidentType.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
        r.narrative.toLowerCase().includes(query.toLowerCase()) ||
        r.officer.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <AppShell title="RMS Report Search" subtitle="Semantic and full-text search across incident reports">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by type, case number, officer, narrative, location…"
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-10 pr-8 appearance-none min-w-[160px]"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 panel">
          <div className="panel-header">
            <span className="text-sm font-medium text-white">Results</span>
            <span className="text-xs text-slate-500">{filtered.length} reports</span>
          </div>
          <div className="divide-y divide-slate-800/50 max-h-[640px] overflow-y-auto">
            {filtered.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelected(report)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-800/30 transition-colors",
                  selected.id === report.id && "bg-cyan-500/5 border-l-2 border-cyan-500"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-cyan-400">{report.id}</span>
                  <ReportStatusBadge status={report.status} />
                </div>
                <div className="text-sm text-slate-200 font-medium">{report.incidentType}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {report.officer} · {formatDateTime(report.createdAt)}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No reports match your search criteria</div>
            )}
          </div>
        </div>

        <div className="xl:col-span-3 panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Report Detail</span>
            </div>
            <ReportStatusBadge status={selected.status} />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Report ID</div>
                <div className="font-mono text-cyan-400">{selected.id}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Case Number</div>
                <div className="font-mono text-slate-300">{selected.caseNumber}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Location</div>
                <div className="text-slate-300">{selected.location}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Officer</div>
                <div className="text-slate-300">
                  {selected.officer} (#{selected.badge})
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Created</div>
                <div className="text-slate-300">{formatDateTime(selected.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Agency</div>
                <div className="text-slate-300">{selected.agencyId.toUpperCase()}</div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Narrative</div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.narrative}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
