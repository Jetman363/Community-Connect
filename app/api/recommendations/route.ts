import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getRecommendations } from "@/lib/ai/recommendations";
import {
  getMockMarketplaceListings,
  getMockBusinessesDto,
  getMockJobs,
} from "@/lib/api/fallback-marketplace";

const querySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().positive().max(50000).optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        const listings = getMockMarketplaceListings();
        return jsonOk({
          nearby: listings.slice(0, 3),
          trending: listings.slice(0, 4),
          businesses: getMockBusinessesDto().slice(0, 4),
          jobs: getMockJobs(),
          source: "mock",
        });
      }
      return jsonError("No community context", 400);
    }

    const data = await withDbTimeout(
      getRecommendations({
        communityId,
        userId,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusM: parsed.data.radiusM,
      })
    );
    return jsonOk({ ...data, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const listings = getMockMarketplaceListings();
      return jsonOk({
        nearby: listings.slice(0, 3),
        trending: listings.slice(0, 4),
        businesses: getMockBusinessesDto().slice(0, 4),
        jobs: getMockJobs(),
        source: "mock",
      });
    }
    return jsonError("Failed to load recommendations", 500);
  }
}
