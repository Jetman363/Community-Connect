"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { IncidentReportForm } from "@/components/reports/IncidentReportForm";
import { useAuth } from "@/lib/auth-context";
import { hasAdminAccess } from "@/lib/rbac";
import type { IncidentReport } from "@/lib/report-types";

export default function WriteReportPage() {
  const { token, officer, roles, authMode } = useAuth();
  const router = useRouter();
  const officerName = officer ? `${officer.rank ?? ""} ${officer.lastName}`.trim() : undefined;
  const isSupervisor = roles.some((r) => ["supervisor", "admin", "superadmin"].includes(r.toLowerCase()));

  if (authMode === "demo" && !token) {
    return (
      <AppShell title="New Incident Report" subtitle="Report writing module">
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-6 text-center">
          API login required to create incident reports. Use admin@sapd.gov or demo.officer credentials.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="New Incident Report" subtitle="Structured report writing · autosave every 30s">
      {token && officer?.agencyId && (
        <IncidentReportForm
          token={token}
          agencyId={officer.agencyId}
          officerName={officerName}
          isSupervisor={isSupervisor}
          isAdmin={hasAdminAccess(roles)}
          onCreated={(report: IncidentReport) => router.replace(`/reports/${report.id}`)}
        />
      )}
    </AppShell>
  );
}
