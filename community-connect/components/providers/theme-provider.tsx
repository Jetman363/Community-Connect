"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("cc-theme") as Theme) || "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light";
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}>({ theme: "system", setTheme: () => {}, resolved: "light" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const resolved = useMemo(() => resolveTheme(theme), [theme]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("cc-theme", theme);
  }, [theme, resolved]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
