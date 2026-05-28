import { apiRequest } from "@/lib/api-client";
import type {
  IncidentReport,
  IncidentReportFormData,
  IncidentReportSummary,
  ReportAuditEntry,
} from "@/lib/report-types";

function reportsRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(`/v1/incident-reports${path}`, { ...options, token });
}

export const reportsApi = {
  search: (token: string, params?: { q?: string; status?: string; incident_number?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.status) qs.set("status", params.status);
    if (params?.incident_number) qs.set("incident_number", params.incident_number);
    const query = qs.toString();
    return reportsRequest<IncidentReportSummary[]>(query ? `?${query}` : "", token);
  },

  get: (token: string, reportId: string) =>
    reportsRequest<IncidentReport>(`/${reportId}`, token),

  create: (token: string, agencyId: string, data: IncidentReportFormData) =>
    reportsRequest<IncidentReport>("", token, {
      method: "POST",
      body: JSON.stringify({ agency_id: agencyId, ...data }),
    }),

  update: (token: string, reportId: string, data: Partial<IncidentReportFormData>) =>
    reportsRequest<IncidentReport>(`/${reportId}`, token, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  autosave: (token: string, reportId: string, data: IncidentReportFormData) =>
    reportsRequest<IncidentReport>(`/${reportId}/autosave`, token, {
      method: "POST",
      body: JSON.stringify({ ...data, change_summary: "Autosave" }),
    }),

  finalize: (token: string, reportId: string) =>
    reportsRequest<IncidentReport>(`/${reportId}/finalize`, token, { method: "POST" }),

  approve: (token: string, reportId: string, approved: boolean, comment?: string) =>
    reportsRequest<IncidentReport>(`/${reportId}/approve`, token, {
      method: "POST",
      body: JSON.stringify({ approved, comment }),
    }),

  lock: (token: string, reportId: string) =>
    reportsRequest<IncidentReport>(`/${reportId}/lock`, token, { method: "POST" }),

  auditLogs: (token: string, reportId: string) =>
    reportsRequest<ReportAuditEntry[]>(`/${reportId}/audit`, token),

  exportPdf: (token: string, reportId: string) =>
    reportsRequest<Record<string, unknown>>(`/${reportId}/export`, token),

  aiDraft: (token: string, payload: Record<string, unknown>) =>
    apiRequest<{ narrative?: string; draft?: string }>("/v1/ai/reports/drafts", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};
