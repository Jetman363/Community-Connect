import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { updateReview, deleteReview } from "@/lib/api/services/reviews";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(3000).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
  const review = await withDbTimeout(updateReview(id, auth.payload.sub, parsed.data));
  if (!review) return jsonError("Not found or forbidden", 404);
  return jsonOk(review);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const ok = await withDbTimeout(deleteReview(id, auth.payload.sub));
  if (!ok) return jsonError("Not found or forbidden", 404);
  return jsonOk({ deleted: true });
}
