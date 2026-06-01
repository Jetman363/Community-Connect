import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getPersonalizationProfile } from "@/lib/api/services/personalization";
import { getUserLocation, getUserPreferences } from "@/lib/api/services/radius-user";
import { scoreRecommendations } from "@/lib/personalization/recommendations";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  let interests = ["events", "deals", "family"];
  let lat: number | undefined;
  let lng: number | undefined;
  let radiusMiles = 10;
  let behaviors: Array<{ eventType: "VIEW" | "CLICK" | "SEARCH" | "SAVE" | "SHARE" | "NAVIGATE"; entityType: string; entityId?: string | null }> = [];

  if (userId) {
    const [profile, loc, prefs] = await Promise.all([
      getPersonalizationProfile(userId),
      getUserLocation(userId),
      getUserPreferences(userId),
    ]);
    interests = profile.interests;
    lat = loc.lat ?? undefined;
    lng = loc.lng ?? undefined;
    radiusMiles = prefs.radiusMiles;

    try {
      behaviors = await prisma.userBehavior.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { eventType: true, entityType: true, entityId: true },
      });
    } catch {
      // mock
    }
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 12);
  const items = scoreRecommendations({
    interests,
    centerLat: lat,
    centerLng: lng,
    radiusMiles,
    behaviors,
    limit,
  });

  return jsonOk({ items, interests, radiusMiles });
}
