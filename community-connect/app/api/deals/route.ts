import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { listDeals } from "@/lib/api/services/deals";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const communityId = req.nextUrl.searchParams.get("communityId") ?? undefined;
  const expiringSoon = req.nextUrl.searchParams.get("expiringSoon") === "true";
  const data = await listDeals({ communityId, userId, expiringSoon });
  return jsonOk(data);
}
