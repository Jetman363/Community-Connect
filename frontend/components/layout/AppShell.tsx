"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Search,
  Network,
  User,
  Settings,
  Shield,
  LogOut,
  Bell,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { hasAdminAccess } from "@/lib/rbac";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/alerts", label: "Live Alerts", icon: AlertTriangle },
  { href: "/reports", label: "Incident Reports", icon: ClipboardList },
  { href: "/reports/ai", label: "AI Report Writer", icon: FileText },
  { href: "/investigations", label: "Investigations", icon: Network },
  { href: "/rms/search", label: "RMS Search", icon: Search },
  { href: "/profile", label: "Officer Profile", icon: User },
  { href: "/admin", label: "Admin Control", icon: Shield, adminOnly: true },
  { href: "/admin/settings", label: "Agency Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { officer, logout, roles } = useAuth();
  const showAdmin = hasAdminAccess(roles);

  return (
    <aside className="w-60 shrink-0 bg-[#0d1321] border-r border-slate-800 flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">BlueCore</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
              {officer?.agency ?? "San Antonio Police Dept."}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.filter((item) => !("adminOnly" in item && item.adminOnly) || showAdmin).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="px-3 py-2 mb-2">
          <div className="text-xs font-medium text-slate-300">
            {officer?.rank} {officer?.lastName}
          </div>
          <div className="text-[10px] text-slate-500">Badge #{officer?.badge}</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export function TopBar({
  title,
  subtitle,
  criticalAlerts = 0,
  wsConnected = false,
}: {
  title: string;
  subtitle?: string;
  criticalAlerts?: number;
  wsConnected?: boolean;
}) {
  return (
    <header className="h-14 shrink-0 border-b border-slate-800 bg-[#0d1321]/80 backdrop-blur flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className={cn("flex items-center gap-1.5 text-xs", wsConnected ? "text-emerald-400" : "text-slate-500")}>
          <Radio className={cn("w-3.5 h-3.5", wsConnected && "animate-pulse")} />
          <span>{wsConnected ? "Live Feed" : "Feed Offline"}</span>
        </div>
        <button className="relative p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-4 h-4" />
          {criticalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {criticalAlerts}
            </span>
          )}
        </button>
        <div className="text-xs text-slate-500 font-mono">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  criticalAlerts,
  wsConnected,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  criticalAlerts?: number;
  wsConnected?: boolean;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} subtitle={subtitle} criticalAlerts={criticalAlerts} wsConnected={wsConnected} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
