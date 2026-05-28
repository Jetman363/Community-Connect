import { apiRequest } from "@/lib/api-client";

export interface AdminUser {
  id: string;
  agency_id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  rank: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Connector {
  id: string;
  connector_type: string;
  name: string;
  agency_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  auth_type: string;
  poll_enabled: boolean;
  health_status: string | null;
  webhook_url?: string;
}

export interface AlertRule {
  id: number;
  agency_id: string;
  name: string;
  rule_type: string;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  enabled: boolean;
  created_at?: string;
}

export interface AuditEntry {
  id: number;
  agency_id: string;
  actor_id: string;
  actor_username: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  status: string;
  created_at: string;
}

function adminRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(`/v1/admin${path}`, { ...options, token });
}

export const adminApi = {
  listUsers: (token: string, q?: string) =>
    adminRequest<AdminUser[]>(`/users${q ? `?q=${encodeURIComponent(q)}` : ""}`, token),

  createUser: (token: string, body: Record<string, unknown>) =>
    adminRequest<AdminUser>("/users", token, { method: "POST", body: JSON.stringify(body) }),

  updateUser: (token: string, userId: string, body: Record<string, unknown>) =>
    adminRequest<AdminUser>(`/users/${userId}`, token, { method: "PATCH", body: JSON.stringify(body) }),

  deleteUser: (token: string, userId: string) =>
    adminRequest<{ deleted: boolean }>(`/users/${userId}`, token, { method: "DELETE" }),

  resetPassword: (token: string, userId: string, newPassword: string) =>
    adminRequest<{ status: string }>(`/users/${userId}/reset-password`, token, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }),

  listConnectorTypes: (token: string) =>
    adminRequest<Array<{ type: string; label?: string; description?: string }>>("/connectors/types", token),

  listConnectors: (token: string) => adminRequest<Connector[]>("/connectors", token),

  createConnector: (token: string, body: Record<string, unknown>) =>
    adminRequest<Connector>("/connectors", token, { method: "POST", body: JSON.stringify(body) }),

  updateConnector: (token: string, id: string, body: Record<string, unknown>) =>
    adminRequest<Connector>(`/connectors/${id}`, token, { method: "PATCH", body: JSON.stringify(body) }),

  deleteConnector: (token: string, id: string) =>
    adminRequest<{ deleted: boolean }>(`/connectors/${id}`, token, { method: "DELETE" }),

  testConnector: (token: string, id: string) =>
    adminRequest<{ status: string; message?: string }>(`/connectors/${id}/test`, token, { method: "POST" }),

  storeCredential: (token: string, id: string, body: { credential_type: string; value: string }) =>
    adminRequest<unknown>(`/connectors/${id}/credentials`, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listRules: (token: string) => adminRequest<AlertRule[]>("/rules", token),

  createRule: (token: string, body: Record<string, unknown>) =>
    adminRequest<{ id: number; name: string }>("/rules", token, { method: "POST", body: JSON.stringify(body) }),

  updateRule: (token: string, ruleId: string, body: Record<string, unknown>) =>
    adminRequest<AlertRule>(`/rules/${ruleId}`, token, { method: "PATCH", body: JSON.stringify(body) }),

  deleteRule: (token: string, ruleId: string) =>
    adminRequest<{ deleted: boolean }>(`/rules/${ruleId}`, token, { method: "DELETE" }),

  listAudit: (token: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return adminRequest<AuditEntry[]>(`/audit${qs}`, token);
  },

  exportAuditUrl: () => "/v1/admin/audit/export",
};
