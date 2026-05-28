"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import { Shield, Award, BarChart3, Mail, Phone, Building } from "lucide-react";

export default function ProfilePage() {
  const { officer } = useAuth();
  if (!officer) return null;

  return (
    <AppShell title="Officer Profile" subtitle={`Badge #${officer.badge} · ${officer.agency}`}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="panel xl:col-span-1">
          <div className="p-6 text-center border-b border-slate-800">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-cyan-400">
                {officer.firstName[0]}
                {officer.lastName[0]}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {officer.rank} {officer.firstName} {officer.lastName}
            </h2>
            <p className="text-sm text-slate-500">Badge #{officer.badge}</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div className="text-slate-300">{officer.agency}</div>
                <div className="text-xs text-slate-500">{officer.division}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-300">{officer.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-300">{officer.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-300">{officer.shift}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="panel p-4 text-center">
              <BarChart3 className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-semibold text-white">{officer.stats.reportsThisMonth}</div>
              <div className="text-xs text-slate-500">Reports This Month</div>
            </div>
            <div className="panel p-4 text-center">
              <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-semibold text-white">{officer.stats.casesAssigned}</div>
              <div className="text-xs text-slate-500">Active Cases</div>
            </div>
            <div className="panel p-4 text-center">
              <BarChart3 className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-semibold text-white">{officer.stats.avgResponseMin}m</div>
              <div className="text-xs text-slate-500">Avg Response Time</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Certifications & Clearances</span>
              </div>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {officer.certifications.map((cert) => (
                <span
                  key={cert}
                  className="badge text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="text-sm font-medium text-white">Recent Activity</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {[
                { action: "Approved AI-generated report RPT-2026-112847", time: "Today, 10:15 AM" },
                { action: "Updated investigation INV-2026-0041 – added entity link", time: "Today, 9:30 AM" },
                { action: "Logged into BlueCore platform", time: "Today, 7:02 AM" },
                { action: "Submitted supplemental report for MC-2026-0892", time: "Yesterday, 4:45 PM" },
                { action: "Completed CJIS security training module", time: "May 24, 2026" },
              ].map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-800/20">
                  <span className="text-sm text-slate-300">{item.action}</span>
                  <span className="text-xs text-slate-500 shrink-0 ml-4">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="text-sm font-medium text-white">Assigned Roles & Permissions</span>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {["officer", "detective", "supervisor"].map((role) => (
                  <span key={role} className="badge text-purple-400 bg-purple-500/10 border-purple-500/20 capitalize">
                    {role}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Agency ID: <span className="font-mono text-slate-400">{officer.agencyId}</span> · Tenant-scoped access
                enforced via RBAC/ABAC policy engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
