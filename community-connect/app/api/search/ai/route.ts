import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getDefaultCommunityId } from "@/lib/api/services/posts";
import { unifiedSearch, type UnifiedSearchTab } from "@/lib/ai/search";
import { z } from "zod";

const schema = z.object({
  q: z.string().min(1).max(200),
  tab: z
    .enum(["all", "marketplace", "events", "businesses", "groups", "news", "alerts"])
    .optional(),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = schema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400);

  try {
    const communityId =
      (await withDbTimeout(getDefaultCommunityId(auth.payload.sub))) ?? "demo-community";
    const results = await unifiedSearch({
      q: parsed.data.q,
      communityId,
      userId: auth.payload.sub,
      tab: parsed.data.tab as UnifiedSearchTab | undefined,
    });
    const res = jsonOk(results);
    res.headers.set("Cache-Control", "private, max-age=30");
    return res;
  } catch (err) {
    if (isDbUnavailable(err)) {
      const results = await unifiedSearch({
        q: parsed.data.q,
        communityId: "demo-community",
        userId: auth.payload.sub,
        tab: parsed.data.tab as UnifiedSearchTab | undefined,
      });
      return jsonOk({ ...results, source: "mock" });
    }
    return jsonError("Search failed", 500);
  }
}
