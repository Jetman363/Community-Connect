import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { nearbyBusinesses } from "@/lib/api/services/businesses";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getMockBusinessesDto } from "@/lib/api/fallback-marketplace";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const radiusM = Number(req.nextUrl.searchParams.get("radiusM") ?? 5000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return jsonError("lat and lng required", 400);
  }

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockBusinessesDto(), source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const items = await withDbTimeout(nearbyBusinesses(communityId, lat, lng, radiusM));
    return jsonOk({ items, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockBusinessesDto(), source: "mock" });
    }
    return jsonError("Failed to load nearby businesses", 500);
  }
}
