"use client";

import { useAuth } from "@/lib/auth-context";
import { Users, Plug, ShieldAlert, ScrollText } from "lucide-react";
import Link from "next/link";

const CARDS = [
  {
    href: "/admin/users",
    title: "User Management",
    desc: "Create users, assign roles, reset passwords, enable/disable accounts",
    icon: Users,
  },
  {
    href: "/admin/connectors",
    title: "Integration Manager",
    desc: "Configure Flock, CAD, LPR, and incident reporting connectors",
    icon: Plug,
  },
  {
    href: "/admin/rules",
    title: "Alert Rule Engine",
    desc: "Geofence, vehicle match, and keyword-based alert triggers",
    icon: ShieldAlert,
  },
  {
    href: "/admin/audit",
    title: "Audit Logs",
    desc: "Searchable, exportable trail of all administrative actions",
    icon: ScrollText,
  },
];

export default function AdminOverviewPage() {
  const { roles, authMode } = useAuth();

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <h2 className="text-lg font-semibold text-white mb-1">Admin Control System</h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          Production-grade RBAC with JWT authentication, encrypted connector credentials, rate-limited admin APIs,
          and immutable audit logging suitable for law enforcement deployment.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="badge text-cyan-400 bg-cyan-500/10 border-cyan-500/20">
            Mode: {authMode === "api" ? "Live API" : "Demo"}
          </span>
          {roles.map((r) => (
            <span key={r} className="badge text-slate-400 bg-slate-800 border-slate-700">
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map(({ href, title, desc, icon: Icon }) => (
          <Link key={href} href={href} className="panel p-5 hover:border-cyan-500/30 transition-colors group">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
