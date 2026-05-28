"use client";

import { AppShell } from "@/components/layout/AppShell";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAuth } from "@/lib/auth-context";
import { hasAdminAccess } from "@/lib/rbac";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles, authMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasAdminAccess(roles) && authMode === "api") {
      router.replace("/dashboard");
    }
  }, [roles, authMode, router]);

  if (!hasAdminAccess(roles) && authMode === "api") {
    return null;
  }

  return (
    <AppShell title="Admin Control" subtitle="Secure platform administration · RBAC enforced">
      <AdminNav />
      {children}
    </AppShell>
  );
}
