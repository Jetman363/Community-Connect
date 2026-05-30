import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { getNearby } from "@/lib/api/services/map";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

const querySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusM: z.coerce.number().positive().default(1609),
  type: z.enum(["alerts", "events", "services"]),
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

    const items = await withDbTimeout(
      getNearby(
        communityId,
        parsed.data.lat,
        parsed.data.lng,
        parsed.data.radiusM,
        parsed.data.type
      )
    );
    return jsonOk({ items, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load nearby", 500);
  }
}
