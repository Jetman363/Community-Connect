import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { getHeatmapData } from "@/lib/api/services/map";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

const querySchema = z.object({
  since: z.string().datetime().optional(),
  category: z.string().optional(),
  severity: z.string().optional(),
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
    if (!communityId) return jsonError("No community context", 400);

    const points = await withDbTimeout(
      getHeatmapData({
        communityId,
        since: parsed.data.since ? new Date(parsed.data.since) : undefined,
        category: parsed.data.category as never,
        severity: parsed.data.severity as never,
      })
    );
    return jsonOk({ points, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ points: [], source: "mock" });
    }
    return jsonError("Failed to load heatmap", 500);
  }
}
