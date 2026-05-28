"use client";

import { MdtThemeProvider } from "@/lib/mdt-theme-context";

export function ThemeShell({ children }: { children: React.ReactNode }) {
  return <MdtThemeProvider>{children}</MdtThemeProvider>;
}
