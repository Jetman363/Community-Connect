import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDiscoverFeed } from "@/lib/api/services/discover-feed";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = req.nextUrl.searchParams;
  const category = params.get("category") ?? undefined;
  const cursor = params.get("cursor") ? Number(params.get("cursor")) : undefined;
  const limit = params.get("limit") ? Number(params.get("limit")) : 10;
  const communityId = params.get("communityId") ?? undefined;

  const data = await getDiscoverFeed({ userId, communityId, category, cursor, limit });
  return jsonOk(data);
}
