"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { AppHeader, MobileSearchBar } from "./header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { FloatingAssistant } from "@/components/ai/floating-assistant";
import { ToastProvider } from "@/components/ui/toast";
import { Menu } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarNav } from "@/config/navigation";
import { usePathname } from "next/navigation";
import { currentUser } from "@/lib/mock-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "MODERATOR";
  const navItems = sidebarNav.filter((item) => !item.adminOnly || isAdmin);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl p-2 hover:bg-[var(--muted)] md:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
                {siteConfig.name.split(" ")[0]}{" "}
                <span className="text-[var(--accent)]">
                  {siteConfig.name.split(" ").slice(1).join(" ")}
                </span>
              </Link>
            </div>
            <AppHeader />
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Link href="/report">
                <Button size="sm" variant="danger">
                  Report
                </Button>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <Link href="/report">
                <Button size="sm" variant="danger">
                  Report
                </Button>
              </Link>
            </div>
          </div>
          <MobileSearchBar />
        </header>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 md:hidden"
                onClick={() => setMenuOpen(false)}
              />
              <motion.nav
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--card)] p-4 md:hidden"
              >
                <p className="mb-4 text-lg font-semibold">Menu</p>
                <div className="space-y-1">
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                        pathname === href
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "text-[var(--muted-foreground)]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-24 pt-6 md:pb-6">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        <MobileNav />
        <FloatingAssistant />
      </div>
    </ToastProvider>
  );
}
