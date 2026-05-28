"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AlertRule } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import { canManageRules } from "@/lib/rbac";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

const RULE_TYPES = [
  { type: "geofence_trigger", label: "Geofence Alert" },
  { type: "vehicle_match", label: "Vehicle Match" },
  { type: "keyword_incident", label: "Keyword Incident Trigger" },
  { type: "bolo_hit", label: "BOLO Hit" },
  { type: "officer_emergency", label: "Officer Emergency" },
];

export default function AdminRulesPage() {
  const { token, roles, authMode, officer } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rule_type: "geofence_trigger",
    keyword: "",
    lat: "",
    lon: "",
    radius_km: "1",
    plate: "",
  });

  const load = useCallback(async () => {
    if (!token && authMode === "demo") {
      setRules([
        {
          id: 1,
          agency_id: officer?.agencyId ?? "",
          name: "Downtown geofence – stolen vehicle",
          rule_type: "geofence_trigger",
          priority: 10,
          conditions: { lat: 29.4241, lon: -98.4936, radius_km: 2 },
          actions: { escalate: true, notify: ["supervisor"] },
          enabled: true,
        },
        {
          id: 2,
          agency_id: officer?.agencyId ?? "",
          name: "BOLO plate ABC-4829",
          rule_type: "vehicle_match",
          priority: 5,
          conditions: { plate: "ABC-4829" },
          actions: { threat_boost: 25 },
          enabled: true,
        },
      ]);
      setLoading(false);
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      setRules(await adminApi.listRules(token));
    } finally {
      setLoading(false);
    }
  }, [token, authMode, officer?.agencyId]);

  useEffect(() => {
    load();
  }, [load]);

  const buildConditions = () => {
    if (form.rule_type === "geofence_trigger") {
      return { lat: parseFloat(form.lat), lon: parseFloat(form.lon), radius_km: parseFloat(form.radius_km) };
    }
    if (form.rule_type === "vehicle_match") {
      return { plate: form.plate };
    }
    if (form.rule_type === "keyword_incident") {
      return { keywords: form.keyword.split(",").map((k) => k.trim()) };
    }
    return {};
  };

  const handleCreate = async () => {
    if (!token) return;
    await adminApi.createRule(token, {
      agency_id: officer?.agencyId,
      name: form.name,
      rule_type: form.rule_type,
      priority: 100,
      conditions: buildConditions(),
      actions: { notify: ["dispatch"], escalate: form.rule_type === "officer_emergency" },
    });
    setShowForm(false);
    load();
  };

  const toggleRule = async (rule: AlertRule) => {
    if (!token) return;
    await adminApi.updateRule(token, String(rule.id), { enabled: !rule.enabled });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete rule?")) return;
    await adminApi.deleteRule(token, String(id));
    load();
  };

  const canWrite = canManageRules(roles) || authMode === "demo";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Alert Rule Builder</h2>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canWrite && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Rule
            </button>
          )}
        </div>
      </div>

      {showForm && canWrite && (
        <div className="panel p-4 space-y-3">
          <input className="input-field text-sm w-full" placeholder="Rule name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input-field text-sm w-full" value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })}>
            {RULE_TYPES.map((t) => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
          {form.rule_type === "geofence_trigger" && (
            <div className="grid grid-cols-3 gap-2">
              <input className="input-field text-sm" placeholder="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              <input className="input-field text-sm" placeholder="Lon" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} />
              <input className="input-field text-sm" placeholder="Radius km" value={form.radius_km} onChange={(e) => setForm({ ...form, radius_km: e.target.value })} />
            </div>
          )}
          {form.rule_type === "vehicle_match" && (
            <input className="input-field text-sm w-full" placeholder="License plate" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
          )}
          {form.rule_type === "keyword_incident" && (
            <input className="input-field text-sm w-full" placeholder="Keywords (comma-separated)" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
          )}
          <button type="button" onClick={handleCreate} className="btn-primary text-sm">Create Rule</button>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="panel p-4 flex flex-wrap justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">{rule.name}</div>
              <div className="text-xs text-slate-500">{rule.rule_type} · priority {rule.priority}</div>
              <pre className="text-[10px] text-slate-600 mt-1 max-w-lg overflow-x-auto">{JSON.stringify(rule.conditions)}</pre>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleRule(rule)} disabled={!canWrite || !token} className={`text-xs ${rule.enabled ? "text-emerald-400" : "text-slate-500"}`}>
                {rule.enabled ? "Enabled" : "Disabled"}
              </button>
              {canWrite && token && (
                <button type="button" onClick={() => handleDelete(rule.id)} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
