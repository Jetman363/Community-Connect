import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import type { UserRole } from "@prisma/client";
import type { PermissionKey } from "./permissions";
import { authorize } from "./check";
import { hasMinRole } from "./rbac";

export interface AuthWithPermission {
  payload: import("@/lib/auth").JwtPayload;
}

export function requirePermission(
  req: NextRequest,
  opts: {
    minRole?: UserRole;
    permission?: PermissionKey;
    communityId?: string | null;
  }
): AuthWithPermission | NextResponse {
  const minRole = opts.minRole ?? "MODERATOR";
  const auth = requireAuth(req, minRole);
  if (!("payload" in auth)) {
    if (opts.permission) {
      const loose = requireAuth(req);
      if (!("payload" in loose)) return loose;
      return loose;
    }
    return auth;
  }

  if (opts.permission && !hasMinRole(auth.payload.role, minRole)) {
    return auth;
  }

  return auth;
}

export async function requirePermissionAsync(
  req: NextRequest,
  opts: {
    minRole?: UserRole;
    permission?: PermissionKey;
    communityId?: string | null;
  }
): Promise<AuthWithPermission | NextResponse> {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const ok = await authorize(auth.payload, {
    minRole: opts.minRole ?? "MODERATOR",
    permission: opts.permission,
    communityId: opts.communityId,
  });

  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return auth;
}
