import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getTrending } from "@/lib/api/services/discover-feed";

export async function GET(req: NextRequest) {
  requireAuth(req);
  const communityId = req.nextUrl.searchParams.get("communityId") ?? undefined;
  const period = (req.nextUrl.searchParams.get("period") as "DAY" | "WEEK" | "MONTH") ?? "DAY";
  const data = await getTrending({ communityId, period });
  return jsonOk(data);
}
