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

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const sidebarNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/family", label: "Family", icon: Calendar },
  { href: "/news", label: "News", icon: FileText },
  { href: "/challenges", label: "Challenges", icon: Shield },
  { href: "/rewards", label: "Rewards", icon: Store },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/services", label: "Services", icon: Building2 },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/map", label: "Map", icon: Map },
  { href: "/hoa", label: "HOA", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
  { href: "/admin/ops", label: "Ops", icon: Map, adminOnly: true },
];

/** Mobile bottom nav — lifestyle-first; Alerts/Map in sidebar/drawer */
export const mobileNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/profile", label: "Profile", icon: User },
];

/** Secondary nav — accessible via sidebar on mobile */
export const secondaryNav: NavItem[] = [
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/map", label: "Map", icon: Map },
  { href: "/feed", label: "Community", icon: MessageSquare },
  { href: "/rewards", label: "Rewards", icon: Store },
];
