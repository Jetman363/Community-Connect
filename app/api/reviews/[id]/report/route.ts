import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { reportReview } from "@/lib/api/services/reviews";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
  await withDbTimeout(reportReview(id, auth.payload.sub, parsed.data.reason, parsed.data.details));
  return jsonOk({ reported: true });
}
