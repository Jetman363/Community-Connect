import {
  Activity,
  BarChart3,
  ClipboardList,
  Shield,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface AdminSettingsLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/** Admin settings hub — platform configuration (not user /settings). */
export const adminSettingsLinks: AdminSettingsLink[] = [
  {
    href: "/admin/settings/privileges",
    label: "Privileges & Roles",
    description: "Assign roles, view RBAC permission matrix",
    icon: Shield,
  },
  {
    href: "/admin/monitoring",
    label: "Website Monitoring",
    description: "Health checks, uptime, errors, integrations",
    icon: Activity,
  },
  {
    href: "/admin/system",
    label: "System Config",
    description: "Cache, queue, observability placeholders",
    icon: Settings,
  },
  {
    href: "/admin",
    label: "Audit Logs",
    description: "Enterprise console audit tab & CSV export",
    icon: ClipboardList,
  },
  {
    href: "/admin/launch",
    label: "Launch Metrics",
    description: "Executive DAU, engagement, and health snapshot",
    icon: BarChart3,
  },
];
