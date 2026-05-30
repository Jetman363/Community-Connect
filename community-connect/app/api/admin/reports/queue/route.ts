import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getReportQueue } from "@/lib/api/services/reports";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { getMockIncidentReports } from "@/lib/api/fallback-safety";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "MODERATOR");
  if (!("payload" in auth)) return auth;

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockIncidentReports(), source: "mock" });
      }
      return jsonError("No community context", 400);
    }

    const result = await withDbTimeout(getReportQueue(communityId));
    return jsonOk(result);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockIncidentReports(), source: "mock" });
    }
    return jsonError("Failed to load queue", 500);
  }
}
