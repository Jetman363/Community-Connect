import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { z } from "zod";
import { getNearby } from "@/lib/api/services/map";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { getMockSafetyAlerts } from "@/lib/api/fallback-safety";

const querySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusM: z.coerce.number().positive().default(3218),
});

type Params = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  const { type } = await params;
  if (!["alerts", "events", "services"].includes(type)) {
    return jsonError("Invalid type — use alerts, events, or services", 400);
  }

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);

    if (!communityId) {
      if (process.env.NODE_ENV === "development" && type === "alerts") {
        return jsonOk({ items: getMockSafetyAlerts(), source: "mock" });
      }
      return jsonError("No community context", 400);
    }

    const items = await withDbTimeout(
      getNearby(
        communityId,
        parsed.data.lat,
        parsed.data.lng,
        parsed.data.radiusM,
        type as "alerts" | "events" | "services"
      )
    );
    return jsonOk({ items, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development" && type === "alerts") {
      return jsonOk({ items: getMockSafetyAlerts(), source: "mock" });
    }
    return jsonError("Failed to load nearby items", 500);
  }
}
