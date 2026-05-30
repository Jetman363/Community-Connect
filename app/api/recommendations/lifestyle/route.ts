import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getLifestyleRecommendations } from "@/lib/ai/lifestyle-recommendations";
import { getPersonalizationProfile } from "@/lib/api/services/personalization";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const profile = userId ? await getPersonalizationProfile(userId) : { interests: ["events", "deals"] };
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  const data = await getLifestyleRecommendations({
    interests: profile.interests,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
  });
  return jsonOk(data);
}
