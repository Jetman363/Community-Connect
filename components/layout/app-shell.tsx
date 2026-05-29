"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            {siteConfig.name.split(" ")[0]}{" "}
            <span className="text-[var(--accent)]">{siteConfig.name.split(" ").slice(1).join(" ")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/report" className="hidden sm:block">
              <Button size="sm" variant="danger">
                Report
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-24 pt-6 md:pb-6">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
