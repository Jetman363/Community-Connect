"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import { reportsApi } from "@/lib/reports-api";
import type { IncidentReportSummary } from "@/lib/report-types";
import { FileText, Plus, Search } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "text-slate-400",
  pending_review: "text-amber-400",
  approved: "text-emerald-400",
  finalized: "text-cyan-400",
  locked: "text-red-400",
};

export default function ReportsPage() {
  const { token, officer, authMode } = useAuth();
  const [reports, setReports] = useState<IncidentReportSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    reportsApi
      .search(token, { q: query || undefined })
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, query]);

  return (
    <AppShell title="Incident Reports" subtitle="RMS report writing & search">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Incident Reports</h2>
            <p className="text-sm text-slate-500 mt-1">
              Structured CJIS-conscious report writing with autosave and supervisor review
            </p>
          </div>
          <Link
            href="/reports/write"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-600 text-white text-sm hover:bg-cyan-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </div>

        {authMode === "demo" && !token && (
          <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-3">
            Sign in with API credentials to create and search reports. Demo mode is read-only for RMS APIs.
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search by incident #, case #, type, officer…"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-md text-slate-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!token}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="border border-slate-700/60 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Incident #</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Officer</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                </tr>
              )}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No reports found
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/reports/${r.id}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                      {r.incident_number ?? r.id.slice(0, 8)}
                    </Link>
                    {r.case_number && <div className="text-xs text-slate-500">Case {r.case_number}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-300 hidden sm:table-cell">{r.incident_type ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{r.reporting_officer_name ?? "—"}</td>
                  <td className={`px-4 py-3 capitalize ${STATUS_COLORS[r.status] ?? "text-slate-400"}`}>
                    {r.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                    {new Date(r.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
