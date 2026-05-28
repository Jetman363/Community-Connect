"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type MdtColorScheme = "dark" | "light";

const STORAGE_KEY = "mdt-color-scheme";

interface MdtThemeContextValue {
  scheme: MdtColorScheme;
  setScheme: (scheme: MdtColorScheme) => void;
  toggleScheme: () => void;
}

const MdtThemeContext = createContext<MdtThemeContextValue | null>(null);

function readStoredScheme(): MdtColorScheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function MdtThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<MdtColorScheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSchemeState(readStoredScheme());
    setReady(true);
  }, []);

  const setScheme = useCallback((next: MdtColorScheme) => {
    setSchemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleScheme = useCallback(() => {
    setSchemeState((prev) => {
      const next: MdtColorScheme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ scheme, setScheme, toggleScheme }),
    [scheme, setScheme, toggleScheme],
  );

  return (
    <MdtThemeContext.Provider value={value}>
      <div data-mdt-theme={ready ? scheme : "dark"} className="mdt-theme-root min-h-screen">
        {children}
      </div>
    </MdtThemeContext.Provider>
  );
}

export function useMdtTheme() {
  const ctx = useContext(MdtThemeContext);
  if (!ctx) throw new Error("useMdtTheme must be used within MdtThemeProvider");
  return ctx;
}
