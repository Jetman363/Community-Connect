import {
  LayoutDashboard,
  Bell,
  Calendar,
  Store,
  Bot,
  Shield,
  Building2,
  Map,
  MessageSquare,
  FileText,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const sidebarNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/services", label: "Services", icon: Building2 },
  { href: "/map", label: "Map", icon: Map },
  { href: "/hoa", label: "HOA", icon: FileText },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export const mobileNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/map", label: "Map", icon: Map },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];
