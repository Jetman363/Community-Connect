import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout } from "@/lib/api/db";
import { reviewSchema } from "@/lib/validations";
import { createReview } from "@/lib/api/services/reviews";
import { prisma } from "@/lib/prisma";
import { broadcastReviewNew } from "@/lib/realtime/marketplace-broadcast";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "review-create"), 5, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const review = await withDbTimeout(
      createReview({
        businessId: parsed.data.businessId,
        authorId: auth.payload.sub,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        categoryRatings: parsed.data.categoryRatings,
        photos: parsed.data.photos,
      })
    );
    const biz = await prisma.business.findUnique({
      where: { id: parsed.data.businessId },
      select: { communityId: true },
    });
    if (biz) broadcastReviewNew(biz.communityId, review);
    return jsonOk(review, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) return jsonError("One review per business", 409);
    return jsonError("Failed to create review", 500);
  }
}
