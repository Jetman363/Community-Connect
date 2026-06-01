"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { PermissionKey } from "@/lib/permissions/permissions";
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions/permissions";
import type { UserRole } from "@prisma/client";

export function usePermissions(role: UserRole, communityRole?: UserRole) {
  const [permissions, setPermissions] = useState<Set<PermissionKey>>(() => {
    const base = new Set<PermissionKey>([
      ...(ROLE_PERMISSIONS[role] ?? []),
      ...(communityRole ? ROLE_PERMISSIONS[communityRole] ?? [] : []),
    ]);
    if (role === "SUPER_ADMIN") {
      Object.values(PERMISSIONS).forEach((p) => base.add(p));
    }
    return base;
  });

  useEffect(() => {
    const base = new Set<PermissionKey>([
      ...(ROLE_PERMISSIONS[role] ?? []),
      ...(communityRole ? ROLE_PERMISSIONS[communityRole] ?? [] : []),
    ]);
    if (role === "SUPER_ADMIN") {
      Object.values(PERMISSIONS).forEach((p) => base.add(p));
    }
    setPermissions(base);
  }, [role, communityRole]);

  const hasPermission = (key: PermissionKey) => permissions.has(key);

  const can = (key: PermissionKey) => hasPermission(key);

  return { permissions, hasPermission, can };
}

export function usePlatformOverview() {
  const [overview, setOverview] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    void apiFetch<Record<string, number>>("/api/admin/overview")
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  return overview;
}
