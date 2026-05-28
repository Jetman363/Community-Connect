"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin } from "@/lib/api-client";
import { CURRENT_OFFICER } from "@/lib/mock-data";
import type { Officer } from "@/types";

function agencyIdFromToken(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.attrs as { agency_id?: string } | undefined)?.agency_id;
  } catch {
    return undefined;
  }
}

function rolesFromToken(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (payload.roles as string[]) ?? [];
  } catch {
    return [];
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  officer: Officer | null;
  token: string | null;
  roles: string[];
  login: (username: string, password: string) => Promise<boolean>;
  enterDemoMode: () => void;
  logout: () => void;
  authMode: "api" | "demo";
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ["/login"];
const TOKEN_KEY = "bluecore-token";
const AUTH_MODE_KEY = "bluecore-auth-mode";
const OFFICER_KEY = "bluecore-officer";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>(["admin"]);
  const [authMode, setAuthMode] = useState<"api" | "demo">("demo");
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedMode = sessionStorage.getItem(AUTH_MODE_KEY) as "api" | "demo" | null;
    const storedOfficer = sessionStorage.getItem(OFFICER_KEY);
    if (storedToken && storedMode === "api") {
      setToken(storedToken);
      setRoles(rolesFromToken(storedToken));
      setAuthMode("api");
      setOfficer(storedOfficer ? JSON.parse(storedOfficer) : CURRENT_OFFICER);
      setIsAuthenticated(true);
    } else if (sessionStorage.getItem("bluecore-auth") === "true") {
      setIsAuthenticated(true);
      setOfficer(CURRENT_OFFICER);
      setRoles(["viewer"]);
      setAuthMode("demo");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    }
    if (isAuthenticated && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, pathname, router]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await apiLogin(username, password);
      const agencyId = agencyIdFromToken(result.access_token) ?? CURRENT_OFFICER.agencyId;
      const tokenRoles = rolesFromToken(result.access_token);
      const officerProfile: Officer = {
        ...CURRENT_OFFICER,
        id: username,
        email: username.includes("@") ? username : `${username}@agency.gov`,
        agencyId,
      };
      setToken(result.access_token);
      setRoles(tokenRoles);
      setAuthMode("api");
      setOfficer(officerProfile);
      setIsAuthenticated(true);
      sessionStorage.setItem(TOKEN_KEY, result.access_token);
      sessionStorage.setItem(AUTH_MODE_KEY, "api");
      sessionStorage.setItem(OFFICER_KEY, JSON.stringify(officerProfile));
      sessionStorage.removeItem("bluecore-auth");
      return true;
    } catch {
      return false;
    }
  };

  const enterDemoMode = () => {
    setIsAuthenticated(true);
    setOfficer(CURRENT_OFFICER);
    setAuthMode("demo");
    setRoles(["viewer"]);
    setToken(null);
    sessionStorage.setItem("bluecore-auth", "true");
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_MODE_KEY);
    router.replace("/dashboard");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setOfficer(null);
    setToken(null);
    setRoles([]);
    setAuthMode("demo");
    sessionStorage.removeItem("bluecore-auth");
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(AUTH_MODE_KEY);
    sessionStorage.removeItem(OFFICER_KEY);
    router.replace("/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Initializing secure session…</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, officer, token, roles, login, enterDemoMode, logout, authMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
