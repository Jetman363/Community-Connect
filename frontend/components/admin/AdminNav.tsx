"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Plug, ShieldAlert, ScrollText, LayoutDashboard } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/connectors", label: "Connectors", icon: Plug },
  { href: "/admin/rules", label: "Alert Rules", icon: ShieldAlert },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
      {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
