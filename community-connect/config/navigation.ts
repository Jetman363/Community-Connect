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
  Mail,
  Compass,
  Users,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { SidebarIcon, MobileNavIcon } from "@/components/icons/marketplace-icon";
import type { ComponentType } from "react";

export type NavIconComponent = ComponentType<{ className?: string }>;

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  Icon?: NavIconComponent;
  adminOnly?: boolean;
}

/** Primary sidebar navigation — Marketplace is top-level, equal weight */
export const sidebarNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/marketplace", label: "Marketplace", Icon: SidebarIcon },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/family", label: "Family", icon: Calendar },
  { href: "/news", label: "News", icon: FileText },
  { href: "/challenges", label: "Challenges", icon: Shield },
  { href: "/rewards", label: "Rewards", icon: Store },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/services", label: "Services", icon: Building2 },
  { href: "/map", label: "Map", icon: Map },
  { href: "/hoa", label: "HOA", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
  { href: "/admin/launch", label: "Launch", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/ops", label: "Ops", icon: Map, adminOnly: true },
];

/** Mobile bottom nav — 6 compact items (v1.0) */
export const mobileNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/marketplace", label: "Market", Icon: MobileNavIcon },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

/** Secondary nav — sidebar drawer on mobile (Events, Alerts, Map, etc.) */
export const secondaryNav: NavItem[] = [
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/map", label: "Map", icon: Map },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/rewards", label: "Rewards", icon: Store },
  { href: "/services", label: "Services", icon: Building2 },
];
