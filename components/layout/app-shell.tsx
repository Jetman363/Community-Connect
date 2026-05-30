"use client";

import { AppHeader, MobileSearchBar } from "./header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { FloatingAssistant } from "@/components/ai/floating-assistant";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Link href="/dashboard" className="shrink-0 font-semibold text-[var(--accent)]">
              Community Connect
            </Link>
            <AppHeader />
          </div>
          <MobileSearchBar />
        </header>

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
