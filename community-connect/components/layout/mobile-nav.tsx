"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Map, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/map", label: "Map", icon: Map },
  { href: "/feed", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-lg md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 safe-bottom">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
