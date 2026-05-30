import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { joinChallenge } from "@/lib/api/services/discover-feed";
import { trackEngagement } from "@/lib/analytics/engagement";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const data = await joinChallenge(id, auth.payload.sub);
  trackEngagement("challenge_join", { userId: auth.payload.sub, challengeId: id });
  return jsonOk(data);
}
