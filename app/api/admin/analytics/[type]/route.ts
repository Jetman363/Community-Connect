import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId, handleDbError } from "@/lib/api/handlers/enterprise";
import { getCommunityAnalytics, type AnalyticsType } from "@/lib/api/services/analytics";
import { getMockAnalytics } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

const TYPES = ["engagement", "safety", "marketplace", "growth", "moderation"] as const;

type Params = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { type } = await params;
  if (!TYPES.includes(type as AnalyticsType)) {
    return jsonError("Invalid analytics type", 400);
  }

  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.ADMIN_ANALYTICS,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);

    const days = Number(req.nextUrl.searchParams.get("days") ?? 14);
    const data = await withDbTimeout(
      getCommunityAnalytics(communityId, type as AnalyticsType, days)
    );
    return jsonOk({ type, communityId, ...data });
  } catch (err) {
    const handled = handleDbError(err);
    if (!handled && isDbUnavailable(err)) {
      return jsonOk(getMockAnalytics(type));
    }
    return handled ?? jsonError("Failed", 500);
  }
}
