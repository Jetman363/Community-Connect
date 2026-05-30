import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { requirePermissionAsync } from "@/lib/permissions/require";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import type { PermissionKey } from "@/lib/permissions/permissions";
import type { UserRole } from "@prisma/client";

export async function enterpriseAuth(
  req: NextRequest,
  opts: { minRole?: UserRole; permission?: PermissionKey; communityId?: string | null }
) {
  const auth = await requirePermissionAsync(req, {
    minRole: opts.minRole ?? "MODERATOR",
    permission: opts.permission,
    communityId: opts.communityId,
  });
  if (!("payload" in auth)) return auth;
  return auth;
}

export async function resolveCommunityId(
  req: NextRequest,
  userId: string,
  override?: string | null
) {
  const id =
    override ??
    req.nextUrl.searchParams.get("communityId") ??
    (await withDbTimeout(getActiveCommunityId(userId, req)));
  return id;
}

export function handleDbError(err: unknown, mock?: () => ReturnType<typeof jsonError>) {
  if (isDbUnavailable(err)) {
    if (mock && process.env.NODE_ENV === "development") {
      return null;
    }
    return jsonError("Database unavailable", 503);
  }
  console.error(err);
  return jsonError("Internal error", 500);
}
