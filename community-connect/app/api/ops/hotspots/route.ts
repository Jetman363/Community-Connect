import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { getSafetyAnalytics } from "@/lib/api/services/safety-analytics";
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
    const analytics = await withDbTimeout(getSafetyAnalytics(communityId));
    return jsonOk({
      hotspots: analytics.hotspots,
      placeholder: "CAD/body-cam integration not configured",
    });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({
        hotspots: [
          { lat: 37.774, lng: -122.42, count: 5, labels: ["Oak Ave"] },
        ],
        source: "mock",
      });
    }
    return jsonError("Failed", 500);
  }
}
