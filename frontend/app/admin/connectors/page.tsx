"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type Connector } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { canManageConnectors } from "@/lib/rbac";
import { CURRENT_OFFICER } from "@/lib/mock-data";
import { Plus, RefreshCw, Zap, Trash2 } from "lucide-react";

const CONNECTOR_TYPES = [
  { type: "flock_safety", label: "Flock Safety API" },
  { type: "generic_cad", label: "CAD System" },
  { type: "generic_lpr", label: "License Plate Recognition" },
  { type: "generic_incident", label: "Incident Reporting" },
  { type: "generic_osint", label: "OSINT Feed" },
  { type: "lifespot", label: "LifeSpot Officer Safety" },
];

export default function AdminConnectorsPage() {
  const { token, roles, authMode, officer } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    connector_type: "flock_safety",
    endpoint: "",
    api_key: "",
  });

  const load = useCallback(async () => {
    if (!token && authMode === "demo") {
      setConnectors([
        {
          id: "demo-flock",
          connector_type: "flock_safety",
          name: "Flock Safety – Sector 7",
          agency_id: officer?.agencyId ?? CURRENT_OFFICER.agencyId,
          enabled: true,
          config: { endpoint: "https://api.flocksafety.com" },
          auth_type: "api_key",
          poll_enabled: true,
          health_status: "healthy",
        },
      ]);
      setLoading(false);
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      setConnectors(await adminApi.listConnectors(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }, [token, authMode, officer?.agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!token) return;
    const created = await adminApi.createConnector(token, {
      agency_id: officer?.agencyId ?? CURRENT_OFFICER.agencyId,
      name: form.name,
      connector_type: form.connector_type,
      config: { endpoint: form.endpoint },
      auth_type: "api_key",
      poll_enabled: true,
      poll_interval_seconds: 60,
    });
    if (form.api_key) {
      await adminApi.storeCredential(token, created.id, {
        credential_type: "api_key",
        value: form.api_key,
      });
    }
    setShowForm(false);
    load();
  };

  const handleTest = async (id: string) => {
    if (!token) return alert("Demo mode — test simulated OK");
    try {
      const result = await adminApi.testConnector(token, id);
      alert(`Connection ${result.status}: ${result.message ?? "OK"}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Test failed");
    }
  };

  const toggleEnabled = async (c: Connector) => {
    if (!token) return;
    await adminApi.updateConnector(token, c.id, { enabled: !c.enabled });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete connector?")) return;
    await adminApi.deleteConnector(token, id);
    load();
  };

  const canWrite = canManageConnectors(roles) || authMode === "demo";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Integration Manager</h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canWrite && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Connector
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">{error}</div>}

      {showForm && canWrite && (
        <div className="panel p-4 space-y-3">
          <input className="input-field text-sm w-full" placeholder="Connector name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input-field text-sm w-full" value={form.connector_type} onChange={(e) => setForm({ ...form, connector_type: e.target.value })}>
            {CONNECTOR_TYPES.map((t) => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
          <input className="input-field text-sm w-full" placeholder="Endpoint URL" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
          <input className="input-field text-sm w-full" placeholder="API Key (encrypted at rest)" type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} />
          <button type="button" onClick={handleCreate} className="btn-primary text-sm">Save Connector</button>
        </div>
      )}

      <div className="grid gap-3">
        {connectors.map((c) => (
          <div key={c.id} className="panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">{c.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{c.connector_type} · {c.health_status ?? "unknown"}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleEnabled(c)} disabled={!canWrite || !token} className={`text-xs ${c.enabled ? "text-emerald-400" : "text-slate-500"}`}>
                {c.enabled ? "Enabled" : "Disabled"}
              </button>
              <button type="button" onClick={() => handleTest(c.id)} className="btn-secondary text-xs flex items-center gap-1">
                <Zap className="w-3 h-3" /> Test
              </button>
              {canWrite && token && (
                <button type="button" onClick={() => handleDelete(c.id)} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {connectors.length === 0 && !loading && (
          <p className="text-center text-sm text-slate-500 py-8">No connectors configured</p>
        )}
      </div>
    </div>
  );
}
