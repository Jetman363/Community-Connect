const DEMO_BASE = process.env.NEXT_PUBLIC_DEMO_ORCHESTRATOR_URL ?? "http://localhost:8090/v1/demo";

async function demoRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${DEMO_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
      if (typeof detail === "object") detail = JSON.stringify(detail);
    } catch { /* ignore */ }
    throw new Error(String(detail));
  }
  return res.json();
}

export async function getDemoStatus() {
  return demoRequest<{ demo_mode: boolean; active_scenario: unknown; incoming_call: unknown }>("/status");
}

export async function toggleDemoMode(enabled: boolean) {
  return demoRequest("/toggle", { method: "POST", body: JSON.stringify({ enabled }) });
}

export async function listScenarios() {
  return demoRequest<{ id: string; name: string; description: string; priority: string }[]>("/scenarios");
}

export async function startScenario(id: string) {
  return demoRequest(`/scenarios/${id}/start`, { method: "POST" });
}

export async function stopScenario() {
  return demoRequest("/scenarios/stop", { method: "POST" });
}

export async function fetchTimeline(incidentId?: string) {
  const q = incidentId ? `?incident_id=${incidentId}` : "";
  return demoRequest<import("./types").TimelineEntry[]>(`/timeline${q}`);
}

export async function fetchMessages(incidentId?: string) {
  const q = incidentId ? `?incident_id=${incidentId}` : "";
  return demoRequest<import("./types").DemoMessage[]>(`/messages${q}`);
}

export async function sendDemoMessage(data: {
  sender_id: string; sender_role: string; message: string;
  priority?: string; incident_id?: string; recipient_role?: string;
}) {
  return demoRequest("/messages", { method: "POST", body: JSON.stringify(data) });
}

export async function createDemoCall(data: Record<string, unknown>) {
  return demoRequest<import("./types").Incident>("/calls/create", { method: "POST", body: JSON.stringify(data) });
}

export async function clearIncomingCall() {
  return demoRequest("/calls/clear", { method: "POST" });
}

export async function addSupervisorNote(incidentId: string, note: string, actorId: string) {
  return demoRequest("/supervisor/note", {
    method: "POST",
    body: JSON.stringify({ incident_id: incidentId, note, actor_id: actorId }),
  });
}

export async function fetchRmsCases(filters?: {
  incident_id?: string;
  incident_number?: string;
  case_number?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.incident_id) params.set("incident_id", filters.incident_id);
  if (filters?.incident_number) params.set("incident_number", filters.incident_number);
  if (filters?.case_number) params.set("case_number", filters.case_number);
  const q = params.toString() ? `?${params}` : "";
  return demoRequest<import("./types").RmsCaseRecord[]>(`/rms/cases${q}`);
}

export async function lookupRmsCaseByIncident(incidentNumber: string) {
  const cases = await fetchRmsCases({ incident_number: incidentNumber });
  return cases[0] ?? null;
}

export async function fetchPendingReports(callSign?: string, officerId?: string, callerRole = "officer") {
  const params = new URLSearchParams({ caller_role: callerRole });
  if (callSign) params.set("call_sign", callSign);
  if (officerId) params.set("officer_id", officerId);
  return demoRequest<import("./types").PendingReport[]>(`/reports/pending?${params}`);
}

export async function fetchReportLayout(reportId: string, callerRole = "officer") {
  return demoRequest<import("./types").ExternalReportLayout>(`/reports/${reportId}/layout?caller_role=${callerRole}`);
}

export async function officerStatusUpdate(data: {
  call_sign: string;
  status: string;
  incident_id?: string;
  require_report?: boolean;
  actor_id: string;
  officer_name?: string;
  caller_role?: string;
}) {
  return demoRequest<Record<string, unknown>>("/officer/status", {
    method: "POST",
    body: JSON.stringify({ ...data, caller_role: data.caller_role ?? "officer" }),
  });
}

export async function createCaseNumber(data: {
  incident_id: string;
  actor_id: string;
  call_sign: string;
  officer_name?: string;
}) {
  return demoRequest<{
    incident: import("./types").Incident;
    case_number: string;
    pending_report: import("./types").PendingReport;
  }>("/reports/create-case", {
    method: "POST",
    body: JSON.stringify({ ...data, caller_role: "officer" }),
  });
}

export async function dispatcherUnitStatusUpdate(data: {
  call_sign: string;
  status: string;
  incident_id?: string;
  release_from_call?: boolean;
  actor_id: string;
  dispatcher_name?: string;
}) {
  return demoRequest<Record<string, unknown>>("/dispatcher/unit-status", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitPendingReport(reportId: string, narrative: string, actorId: string, callerRole = "officer") {
  return demoRequest<import("./types").PendingReport>(`/reports/${reportId}/submit`, {
    method: "POST",
    body: JSON.stringify({ narrative, actor_id: actorId, caller_role: callerRole }),
  });
}
