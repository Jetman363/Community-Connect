import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { listGroups } from "@/lib/api/services/groups";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const category = req.nextUrl.searchParams.get("category") ?? undefined;
  const communityId = req.nextUrl.searchParams.get("communityId") ?? undefined;
  const data = await listGroups({ communityId, category, userId });
  return jsonOk(data);
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  return jsonOk({ message: "Group creation stub — use admin in production", source: "stub" });
}
