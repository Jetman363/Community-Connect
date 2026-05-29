"use client";

import { useState } from "react";
import { AppHeader, MobileMenu } from "./header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { FloatingAssistant } from "@/components/ai/floating-assistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <AppHeader onMenuToggle={() => setMenuOpen((o) => !o)} />
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

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
