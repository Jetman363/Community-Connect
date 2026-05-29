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
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const sidebarNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/services", label: "Services", icon: Building2 },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/map", label: "Map", icon: Map },
  { href: "/hoa", label: "HOA", icon: FileText },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

export const mobileNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/map", label: "Map", icon: Map },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];
