"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sidebarNav } from "@/config/navigation";
import { currentUser } from "@/lib/mock-data";
import { usePersonalization } from "@/hooks/use-personalization";
import { canManageAdminSettings, hasMinRole } from "@/lib/permissions/rbac";
import type { UserRole } from "@prisma/client";

function canSeeNavItem(role: UserRole, item: (typeof sidebarNav)[number]) {
  if (item.platformAdminOnly) return canManageAdminSettings(role);
  if (item.adminOnly) return hasMinRole(role, "MODERATOR");
  return true;
}

export function Sidebar() {
  const pathname = usePathname();
  const role = currentUser.role as UserRole;
  const { navigation } = usePersonalization();
  const ranked = navigation?.sidebar ?? sidebarNav;
  const items = ranked.filter((item) => canSeeNavItem(role, item));

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
        {items.map(({ href, label, icon: LucideIcon, Icon: CustomIcon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-[var(--accent)]/10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {CustomIcon ? (
                  <CustomIcon className="h-4 w-4" />
                ) : LucideIcon ? (
                  <LucideIcon className="h-4 w-4" />
                ) : null}
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
