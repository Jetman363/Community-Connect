import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { listNews } from "@/lib/api/services/discover-feed";

export async function GET(req: NextRequest) {
  requireAuth(req);
  const communityId = req.nextUrl.searchParams.get("communityId") ?? undefined;
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const data = await listNews({ communityId, category });
  return jsonOk(data);
}
