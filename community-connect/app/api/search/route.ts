import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { searchQuerySchema } from "@/lib/validations";
import { searchAll } from "@/lib/api/services/search";
import { getDefaultCommunityId } from "@/lib/api/services/posts";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400);

  try {
    const communityId = userId
      ? await withDbTimeout(getDefaultCommunityId(userId))
      : undefined;

    const results = await withDbTimeout(
      searchAll(parsed.data.q, communityId ?? undefined, parsed.data.limit)
    );
    return jsonOk(results);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Search failed", 500);
  }
}
