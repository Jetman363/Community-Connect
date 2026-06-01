import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { businessQuerySchema } from "@/lib/validations";
import { listBusinesses } from "@/lib/api/services/businesses";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getMockBusinessesDto } from "@/lib/api/fallback-marketplace";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const parsed = businessQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockBusinessesDto(), nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const result = await withDbTimeout(
      listBusinesses({ communityId, userId, search: q ?? parsed.data.search, ...parsed.data })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockBusinessesDto(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Search failed", 500);
  }
}
