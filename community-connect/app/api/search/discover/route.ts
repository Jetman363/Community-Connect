import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { searchMarketplaceSchema } from "@/lib/validations";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { discoverSearch } from "@/lib/api/services/discover";
import {
  getMockMarketplaceListings,
  getMockBusinessesDto,
  getMockJobs,
} from "@/lib/api/fallback-marketplace";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = searchMarketplaceSchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({
          listings: getMockMarketplaceListings(),
          businesses: getMockBusinessesDto(),
          jobs: getMockJobs(),
          source: "mock",
        });
      }
      return jsonError("No community context", 400);
    }

    const result = await withDbTimeout(
      discoverSearch({
        communityId,
        userId,
        q: parsed.data.q ?? parsed.data.search,
        category: parsed.data.category,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusM: parsed.data.radiusM,
        verified: parsed.data.verified,
        priceMin: parsed.data.priceMin,
        priceMax: parsed.data.priceMax,
        limit: parsed.data.limit,
      })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({
        listings: getMockMarketplaceListings(),
        businesses: getMockBusinessesDto(),
        jobs: getMockJobs(),
        source: "mock",
      });
    }
    return jsonError("Discover search failed", 500);
  }
}
