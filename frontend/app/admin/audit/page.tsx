"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AuditEntry } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-config";
import { Download, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AdminAuditPage() {
  const { token, authMode } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: "", resource_type: "" });

  const load = useCallback(async () => {
    if (!token && authMode === "demo") {
      setLogs([
        {
          id: 1,
          agency_id: "00000000-0000-4000-8000-000000000001",
          actor_id: "admin-1",
          actor_username: "admin@sapd.gov",
          action: "connector.create",
          resource_type: "connector",
          resource_id: "flock-7",
          ip_address: "10.0.1.42",
          status: "success",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          agency_id: "00000000-0000-4000-8000-000000000001",
          actor_id: "admin-1",
          actor_username: "admin@sapd.gov",
          action: "user.update",
          resource_type: "user",
          resource_id: "u-2847",
          ip_address: "10.0.1.42",
          status: "success",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter.action) params.action = filter.action;
      if (filter.resource_type) params.resource_type = filter.resource_type;
      setLogs(await adminApi.listAudit(token, params));
    } finally {
      setLoading(false);
    }
  }, [token, authMode, filter.action, filter.resource_type]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!token) return alert("Export requires live API session");
    window.open(`${API_BASE_URL}${adminApi.exportAuditUrl()}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={exportCsv} className="btn-primary flex items-center gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input className="input-field text-sm w-40" placeholder="Filter action" value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} />
        <input className="input-field text-sm w-40" placeholder="Resource type" value={filter.resource_type} onChange={(e) => setFilter({ ...filter, resource_type: e.target.value })} />
      </div>

      <div className="panel overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                <td className="text-xs font-mono text-cyan-400">{log.actor_id}</td>
                <td className="text-xs text-slate-300">{log.action}</td>
                <td className="text-xs text-slate-400">{log.resource_type}{log.resource_id ? ` / ${log.resource_id}` : ""}</td>
                <td className="text-xs text-slate-600">{log.ip_address ?? "—"}</td>
                <td className={`text-xs ${log.status === "success" ? "text-emerald-400" : "text-red-400"}`}>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !loading && (
          <p className="p-6 text-center text-sm text-slate-500">No audit entries</p>
        )}
      </div>
    </div>
  );
}
