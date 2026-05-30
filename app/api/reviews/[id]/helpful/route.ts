import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { voteHelpful } from "@/lib/api/services/reviews";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const result = await withDbTimeout(voteHelpful(id, auth.payload.sub));
  return jsonOk(result);
}
