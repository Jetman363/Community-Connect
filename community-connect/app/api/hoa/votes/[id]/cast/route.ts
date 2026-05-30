import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { castVote } from "@/lib/api/services/enterprise";
import { voteCastSchema } from "@/lib/validations/enterprise";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = voteCastSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const result = await withDbTimeout(
      castVote(id, auth.payload.sub, parsed.data.optionIndex)
    );
    if ("error" in result && result.error) return jsonError(result.error, 400);
    return jsonOk(result);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
