import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getSafetyAnalytics } from "@/lib/api/services/safety-analytics";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "MODERATOR");
  if (!("payload" in auth)) return auth;

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community context", 400);

    const analytics = await withDbTimeout(getSafetyAnalytics(communityId));
    return jsonOk(analytics);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({
        activeAlerts: 4,
        openReports: 1,
        reportsByCategory: [{ category: "MAINTENANCE", count: 1 }],
        alertsBySeverity: [{ severity: "CRITICAL", count: 1 }],
        hotspots: [],
        source: "mock",
      });
    }
    return jsonError("Failed to load analytics", 500);
  }
}
