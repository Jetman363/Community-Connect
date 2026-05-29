"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sidebarNav } from "@/config/navigation";
import { currentUser } from "@/lib/mock-data";

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "MODERATOR";

  const items = sidebarNav.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
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
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
