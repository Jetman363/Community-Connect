import type { UserRole } from "@prisma/client";

const DEMO_PASSWORD = "Demo1234!";

const DEMO_USERS: Record<
  string,
  { id: string; role: UserRole; displayName: string; verified: boolean }
> = {
  "demo@communityconnect.app": {
    id: "demo-admin",
    role: "ADMIN",
    displayName: "Demo Admin",
    verified: true,
  },
  "resident@communityconnect.app": {
    id: "demo-resident",
    role: "RESIDENT",
    displayName: "Alex Resident",
    verified: true,
  },
  "safety@communityconnect.app": {
    id: "demo-safety",
    role: "PUBLIC_SAFETY",
    displayName: "Oak Hills PD",
    verified: true,
  },
  "hoa@communityconnect.app": {
    id: "demo-hoa",
    role: "HOA_MANAGER",
    displayName: "HOA Board",
    verified: true,
  },
  "dispatch@communityconnect.app": {
    id: "demo-dispatch",
    role: "DISPATCHER",
    displayName: "Dispatch Center",
    verified: true,
  },
  "super@communityconnect.app": {
    id: "demo-super",
    role: "SUPER_ADMIN",
    displayName: "Super Admin",
    verified: true,
  },
};

/** Dev-only fallback when PostgreSQL is unavailable (matches seed credentials). */
export function authenticateDemoUser(email: string, password: string) {
  if (process.env.NODE_ENV === "production") return null;
  if (password !== DEMO_PASSWORD) return null;

  const normalized = email.trim().toLowerCase();
  const user = DEMO_USERS[normalized];
  if (!user) return null;

  return { ...user, email: normalized };
}

export function isDemoEmail(email: string): boolean {
  return email.trim().toLowerCase() in DEMO_USERS;
}
