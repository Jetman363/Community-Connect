import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { canModerate } from "@/lib/permissions/rbac";
import { listFlaggedListings } from "@/lib/api/services/marketplace";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { getMockMarketplaceListings } from "@/lib/api/fallback-marketplace";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canModerate(auth.payload.role)) return jsonError("Forbidden", 403);

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    const items = await withDbTimeout(listFlaggedListings(communityId ?? undefined));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockMarketplaceListings().slice(0, 2) });
    }
    return jsonError("Failed to load moderation queue", 500);
  }
}
