"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_SETTINGS } from "@/lib/mock-data";
import { Settings, Shield, Cpu, Plug, Building2, Save } from "lucide-react";

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-cyan-600" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

export default function AdminSettingsPage() {
  const [mfaRequired, setMfaRequired] = useState(ADMIN_SETTINGS.security.mfaRequired);
  const [aiEnabled, setAiEnabled] = useState(ADMIN_SETTINGS.ai.reportAssistantEnabled);
  const [humanReview, setHumanReview] = useState(ADMIN_SETTINGS.ai.humanReviewRequired);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Admin Settings" subtitle="Agency configuration · Security · Integrations">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Agency Configuration</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Agency Name</label>
              <input className="input-field" defaultValue={ADMIN_SETTINGS.agency.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">ORI Number</label>
                <input className="input-field font-mono" defaultValue={ADMIN_SETTINGS.agency.ori} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">CJIS ID</label>
                <input className="input-field font-mono text-xs" defaultValue={ADMIN_SETTINGS.agency.cjisId} />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Timezone</label>
              <select className="input-field" defaultValue={ADMIN_SETTINGS.agency.timezone}>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Security & Compliance</span>
            </div>
          </div>
          <div className="p-4 space-y-1 divide-y divide-slate-800/50">
            <Toggle enabled={mfaRequired} onChange={setMfaRequired} label="Require MFA for all users" />
            <div className="py-2">
              <label className="text-xs text-slate-500 mb-1 block">Session Timeout (minutes)</label>
              <input
                type="number"
                className="input-field w-32"
                defaultValue={ADMIN_SETTINGS.security.sessionTimeoutMin}
              />
            </div>
            <div className="py-2">
              <label className="text-xs text-slate-500 mb-1 block">Password Policy</label>
              <input className="input-field" defaultValue={ADMIN_SETTINGS.security.passwordPolicy} disabled />
            </div>
            <div className="py-2">
              <label className="text-xs text-slate-500 mb-1 block">Audit Log Retention (days)</label>
              <input
                type="number"
                className="input-field w-32"
                defaultValue={ADMIN_SETTINGS.security.auditRetentionDays}
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">AI Configuration</span>
            </div>
          </div>
          <div className="p-4 space-y-1 divide-y divide-slate-800/50">
            <Toggle enabled={aiEnabled} onChange={setAiEnabled} label="Enable AI Report Assistant" />
            <Toggle enabled={humanReview} onChange={setHumanReview} label="Require human review before finalization" />
            <div className="py-2">
              <label className="text-xs text-slate-500 mb-1 block">LLM Provider</label>
              <select className="input-field" defaultValue={ADMIN_SETTINGS.ai.llmProvider}>
                <option>Anthropic Claude</option>
                <option>OpenAI GPT-4</option>
              </select>
            </div>
            <div className="py-2">
              <label className="text-xs text-slate-500 mb-1 block">Max Tokens Per Request</label>
              <input type="number" className="input-field w-32" defaultValue={ADMIN_SETTINGS.ai.maxTokensPerRequest} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">System Integrations</span>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {Object.entries(ADMIN_SETTINGS.integrations).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <span className="text-sm text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-sm text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
        {saved && <span className="text-sm text-emerald-400">Settings saved successfully</span>}
      </div>

      <div className="mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-2">
        <Settings className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Configuration changes are logged to the immutable audit trail. Security and AI policy changes require
          supervisor approval in production environments. FedRAMP-ready deployment structure supports environment-based
          configuration management.
        </p>
      </div>
    </AppShell>
  );
}
