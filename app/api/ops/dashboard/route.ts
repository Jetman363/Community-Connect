import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { getOpsDashboard } from "@/lib/api/services/enterprise";
import { getMockOpsDashboard } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "PUBLIC_SAFETY",
    permission: PERMISSIONS.OPS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);
    const dashboard = await withDbTimeout(getOpsDashboard(communityId));
    return jsonOk(dashboard);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk(getMockOpsDashboard());
    }
    return jsonError("Failed", 500);
  }
}
