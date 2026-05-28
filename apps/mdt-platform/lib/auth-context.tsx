"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { OfficerLoginInput } from "./officer-roster";
import { validateProgramLogin, roleRequiresServiceArea, type ProgramLoginInput } from "./program-rosters";
import type { User, UserRole } from "./types";
import { AGENCY_ID } from "./config";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  loginProgram: (input: ProgramLoginInput) => string | null;
  /** @deprecated Use loginProgram — kept for officer form compatibility */
  loginOfficer: (input: OfficerLoginInput) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mdt_user");
    const savedToken = localStorage.getItem("mdt_token");
    if (saved) setUser(JSON.parse(saved));
    if (savedToken) setToken(savedToken);
    setReady(true);
  }, []);

  const applySession = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("mdt_user", JSON.stringify(nextUser));
    localStorage.setItem("mdt_token", nextToken);
  };

  const loginProgram = (input: ProgramLoginInput): string | null => {
    const result = validateProgramLogin(input);
    if (!result.ok) return result.error;

    const { profile } = result;
    const sessionUser: User = {
      id: profile.id,
      name: profile.name,
      badge: profile.badge,
      role: profile.role,
      ...(input.serviceArea ? { serviceArea: input.serviceArea } : {}),
      unitCallSign: input.unitCallSign,
      agencyId: AGENCY_ID,
      ...(profile.supervisorMode ? { supervisorMode: true } : {}),
    };
    const unitPart = input.unitCallSign ? `:${input.unitCallSign}` : "";
    const demoToken = `demo:${AGENCY_ID}:${profile.role}:${profile.id}${unitPart}`;
    applySession(sessionUser, demoToken);
    return null;
  };

  const loginOfficer = (input: OfficerLoginInput): string | null =>
    loginProgram({
      role: "officer",
      userId: input.officerId,
      serviceArea: input.serviceArea,
      password: input.password,
      unitCallSign: input.unitCallSign,
    });

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("mdt_user");
    localStorage.removeItem("mdt_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, loginProgram, loginOfficer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireProgram(role: UserRole, loginPath: string) {
  const { user } = useAuth();
  const authorized =
    user?.role === role &&
    (!roleRequiresServiceArea(role) || !!user.serviceArea);
  return { user: authorized ? user : null, loginPath };
}
