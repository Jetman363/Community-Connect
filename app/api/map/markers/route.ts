import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { mapMarkersQuerySchema } from "@/lib/validations";
import { getMapMarkers } from "@/lib/api/services/map";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { getMockMapMarkers } from "@/lib/api/fallback-safety";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = mapMarkersQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  const layerParam = parsed.data.layer ?? "all";
  const layers: import("@/lib/api/services/map").MapLayer[] =
    layerParam === "all"
      ? ["all"]
      : (layerParam.split(",") as import("@/lib/api/services/map").MapLayer[]);

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);

    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ markers: getMockMapMarkers(), source: "mock" });
      }
      return jsonError("No community context", 400);
    }

    const markers = await withDbTimeout(
      getMapMarkers({
        communityId,
        layers,
        minLat: parsed.data.minLat,
        maxLat: parsed.data.maxLat,
        minLng: parsed.data.minLng,
        maxLng: parsed.data.maxLng,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusM: parsed.data.radiusM,
      })
    );
    return jsonOk({ markers, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ markers: getMockMapMarkers(), source: "mock" });
    }
    return jsonError("Failed to load markers", 500);
  }
}
