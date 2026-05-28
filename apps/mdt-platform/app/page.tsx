"use client";

import Link from "next/link";
import { Radio, Shield, Phone, Monitor, LogOut, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { OperationsThemeToggle } from "@/components/shared/OperationsThemeToggle";
import { DemoControlPanel } from "@/components/shared/DemoControlPanel";
import { IncidentTimeline } from "@/components/shared/IncidentTimeline";
import { useDemo } from "@/lib/demo-store";
import { useHydrated } from "@/lib/use-hydrated";
import type { UserRole } from "@/lib/types";

const INTERFACES: {
  role: UserRole;
  title: string;
  desc: string;
  href: string;
  loginHref: string;
  icon: typeof Radio;
}[] = [
  { role: "calltaker", title: "911 Call Intake", desc: "Emergency call handling with AI parsing", href: "/calltaker", loginHref: "/calltaker/login", icon: Phone },
  { role: "dispatcher", title: "CAD Dispatch", desc: "Unit assignment, incident queue, live status", href: "/dispatch", loginHref: "/dispatch/login", icon: Monitor },
  { role: "supervisor", title: "Supervisor Command", desc: "Force monitor, escalation, timeline oversight", href: "/supervisor", loginHref: "/supervisor/login", icon: Eye },
  { role: "officer", title: "Officer MDT", desc: "Patrol terminal — dispatch, status, messaging", href: "/mdt", loginHref: "/mdt/login", icon: Radio },
  { role: "admin", title: "Admin / Demo Control", desc: "Scenario launcher and demo mode toggle", href: "/supervisor", loginHref: "/admin/login", icon: Shield },
];

export default function HomePage() {
  const { user, logout, ready: authReady } = useAuth();
  const { timeline, demoMode } = useDemo();
  const hydrated = useHydrated();
  const showUser = hydrated && authReady && user;

  return (
    <div className="min-h-screen bg-[#0c0c0e] flex flex-col pt-8">
      <header className="border-b border-[#2a2a32] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-100">BlueCore Demo Operations</h1>
            <p className="text-xs text-slate-500">
              Connected ecosystem — 911 · CAD · Supervisor · MDT · RMS
              {hydrated && demoMode && (
                <span className="text-purple-400 ml-2">● DEMO MODE ACTIVE</span>
              )}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {showUser && (
            <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
          <OperationsThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {!showUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="text-center py-4">
                <h2 className="text-2xl font-semibold text-slate-200 mb-2">Select Program to Sign In</h2>
                <p className="text-slate-500">
                  Each console requires a unique user and password; most also require a service area
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INTERFACES.map(({ title, desc, loginHref, icon: Icon }) => (
                  <Link
                    key={loginHref}
                    href={loginHref}
                    className="tactical-panel p-6 text-left hover:border-blue-500/50 transition-colors group block"
                  >
                    <Icon className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{desc}</p>
                    <p className="text-[10px] text-cyan-600/70 mt-2">Sign-in required</p>
                  </Link>
                ))}
              </div>
            </div>
            <DemoControlPanel />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="tactical-panel p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Signed in as</p>
                  <p className="font-semibold text-slate-100">
                    {user.name} — {user.role.replace("_", " ")}
                    {user.serviceArea && <span className="text-cyan-600/80"> · {user.serviceArea}</span>}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">Badge #{user.badge}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INTERFACES.filter((i) => programMatchesUser(i.role, user.role)).map(({ title, desc, href, icon: Icon }) => (
                  <Link
                    key={href + title}
                    href={href}
                    className="tactical-panel p-6 hover:border-blue-500/50 transition-colors block"
                  >
                    <Icon className="w-10 h-10 text-blue-500 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <DemoControlPanel />
              <div className="tactical-panel p-4 max-h-64 overflow-y-auto">
                <p className="text-xs uppercase text-slate-500 mb-2">Live Event Timeline</p>
                <IncidentTimeline entries={timeline} limit={15} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#2a2a32] px-6 py-3 text-center text-xs text-slate-600">
        Demo Workflow · Real-time WebSocket sync · Audit logged · CJIS-ready architecture
      </footer>
    </div>
  );
}

function programMatchesUser(programRole: UserRole, userRole: UserRole): boolean {
  if (userRole === "admin") return programRole === "admin" || programRole === "supervisor";
  return programRole === userRole;
}
