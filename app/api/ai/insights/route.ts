import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getCommunityInsights } from "@/lib/ai/insights";
import { getPersonalizationProfile } from "@/lib/api/services/personalization";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const profile =
    "payload" in auth ? await getPersonalizationProfile(auth.payload.sub) : { interests: [] };

  const data = await getCommunityInsights({
    communityName: req.nextUrl.searchParams.get("community") ?? "Oak Hills",
    interests: profile.interests,
  });

  const res = jsonOk(data);
  res.headers.set("Cache-Control", "private, max-age=120");
  return res;
}
