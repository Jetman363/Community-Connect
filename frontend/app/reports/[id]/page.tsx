"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { IncidentReportForm } from "@/components/reports/IncidentReportForm";
import { useAuth } from "@/lib/auth-context";
import { reportsApi } from "@/lib/reports-api";
import { hasAdminAccess } from "@/lib/rbac";
import type { IncidentReport } from "@/lib/report-types";

export default function EditReportPage() {
  const params = useParams();
  const reportId = params.id as string;
  const { token, officer, roles, authMode } = useAuth();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupervisor = roles.some((r) => ["supervisor", "admin", "superadmin"].includes(r.toLowerCase()));
  const officerName = officer ? `${officer.rank ?? ""} ${officer.lastName}`.trim() : undefined;

  useEffect(() => {
    if (!token || !reportId) {
      setLoading(false);
      return;
    }
    reportsApi
      .get(token, reportId)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, reportId]);

  if (authMode === "demo" && !token) {
    return (
      <AppShell title="Incident Report" subtitle="Report writing module">
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-6 text-center">
          API login required to view incident reports.
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell title="Incident Report" subtitle="Loading…">
        <div className="flex items-center justify-center py-20 text-slate-500">Loading report…</div>
      </AppShell>
    );
  }

  if (error || !report) {
    return (
      <AppShell title="Incident Report" subtitle="Error">
        <div className="text-sm text-red-400">{error ?? "Report not found"}</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Report ${report.header.incident_number ?? reportId.slice(0, 8)}`}
      subtitle={`Status: ${report.status.replace("_", " ")} · CJIS audit logged`}
    >
      {token && officer?.agencyId && (
        <IncidentReportForm
          token={token}
          agencyId={officer.agencyId}
          officerName={officerName}
          initialReport={report}
          isSupervisor={isSupervisor}
          isAdmin={hasAdminAccess(roles)}
        />
      )}
    </AppShell>
  );
}
