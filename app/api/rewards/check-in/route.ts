import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { dailyCheckIn } from "@/lib/api/services/rewards";
import { trackEngagement } from "@/lib/analytics/engagement";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const data = await dailyCheckIn(auth.payload.sub);
  if (!data.alreadyCheckedIn) {
    trackEngagement("check_in", { userId: auth.payload.sub, streak: data.streak });
  }
  return jsonOk(data);
}
