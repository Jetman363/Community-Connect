"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNav } from "@/config/navigation";
import { usePersonalization } from "@/hooks/use-personalization";

export function MobileNav() {
  const pathname = usePathname();
  const { navigation } = usePersonalization();
  const items = navigation?.mobile ?? mobileNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl md:hidden">
      <div className="safe-bottom mx-auto flex max-w-lg items-stretch justify-between px-1 py-1.5">
        {items.map(({ href, label, icon: LucideIcon, Icon: CustomIcon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"
              )}
            >
              {CustomIcon ? (
                <CustomIcon className="h-[18px] w-[18px]" />
              ) : LucideIcon ? (
                <LucideIcon className={cn("h-[18px] w-[18px]", active && "stroke-[2.5]")} />
              ) : null}
              <span className="truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
