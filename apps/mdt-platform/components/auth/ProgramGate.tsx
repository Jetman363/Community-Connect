"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { roleRequiresServiceArea } from "@/lib/program-rosters";
import type { User, UserRole } from "@/lib/types";

export function ProgramGate({
  roles,
  loginPath,
  user,
  requireServiceArea,
  children,
}: {
  roles: UserRole[];
  loginPath: string;
  user: User | null | undefined;
  /** When omitted, inferred from role (calltaker does not require service area) */
  requireServiceArea?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const needsServiceArea =
    requireServiceArea ??
    (user ? roleRequiresServiceArea(user.role) : roles.some((r) => roleRequiresServiceArea(r)));
  const authorized =
    !!user &&
    roles.includes(user.role) &&
    (!needsServiceArea || !!user.serviceArea);

  useEffect(() => {
    if (!authorized) {
      router.replace(loginPath);
    }
  }, [authorized, loginPath, router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Redirecting to sign-in…
      </div>
    );
  }

  return <>{children}</>;
}
