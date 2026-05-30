import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { listWorkflowCases } from "@/lib/api/services/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.WORKFLOWS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listWorkflowCases(communityId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
