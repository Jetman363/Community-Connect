import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { respondToReview } from "@/lib/api/services/reviews";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ response: z.string().min(10).max(2000) });

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
  const review = await withDbTimeout(
    respondToReview(id, auth.payload.sub, parsed.data.response)
  );
  if (!review) return jsonError("Not found or forbidden", 404);
  return jsonOk(review);
}
