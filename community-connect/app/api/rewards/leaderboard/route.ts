import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getLeaderboard } from "@/lib/api/services/rewards";

export async function GET(req: NextRequest) {
  requireAuth(req);
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 10);
  const data = await getLeaderboard(limit);
  return jsonOk(data);
}
