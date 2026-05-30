import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { listChallenges } from "@/lib/api/services/discover-feed";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const communityId = req.nextUrl.searchParams.get("communityId") ?? undefined;
  const data = await listChallenges({ communityId, userId });
  return jsonOk(data);
}
