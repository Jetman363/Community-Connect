import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { leaveGroup } from "@/lib/api/services/groups";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const data = await leaveGroup(id, auth.payload.sub);
  return jsonOk(data);
}
