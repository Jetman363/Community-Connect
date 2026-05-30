import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { getOpsIncidents } from "@/lib/api/services/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { canDispatch } from "@/lib/permissions/rbac";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "PUBLIC_SAFETY",
    permission: PERMISSIONS.OPS_VIEW,
  });
  if (!("payload" in auth)) return auth;
  if (!canDispatch(auth.payload.role) && auth.payload.role !== "MODERATOR") {
    return jsonError("Forbidden", 403);
  }

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(getOpsIncidents(communityId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
