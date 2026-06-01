import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "PUBLIC_SAFETY",
    permission: PERMISSIONS.OPS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityId) return jsonError("entityId required", 400);

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    const logs = await withDbTimeout(
      prisma.auditLog.findMany({
        where: {
          resourceId: entityId,
          ...(communityId ? { communityId } : {}),
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      })
    );
    return jsonOk({ items: logs, placeholder: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
