import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { searchMarketplaceSchema } from "@/lib/validations";
import { searchListings, getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getMockMarketplaceListings } from "@/lib/api/fallback-marketplace";

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
        let items = getMockMarketplaceListings();
        if (parsed.data.q) {
          const q = parsed.data.q.toLowerCase();
          items = items.filter(
            (l) =>
              l.title.toLowerCase().includes(q) ||
              (l.description?.toLowerCase().includes(q) ?? false)
          );
        }
        return jsonOk({ items, nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const result = await withDbTimeout(
      searchListings({
        communityId,
        userId,
        search: parsed.data.q ?? parsed.data.search,
        ...parsed.data,
      })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockMarketplaceListings(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Search failed", 500);
  }
}
