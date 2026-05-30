import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { reviewSchema } from "@/lib/validations";
import { listReviews, createReview } from "@/lib/api/services/reviews";
import { broadcastReviewNew } from "@/lib/realtime/marketplace-broadcast";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  try {
    const items = await withDbTimeout(listReviews(id, userId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonOk({ items: [] });
    return jsonError("Failed to load reviews", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "review-create"), 5, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id: businessId } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse({ ...body, businessId });
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const review = await withDbTimeout(
      createReview({
        businessId,
        authorId: auth.payload.sub,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        categoryRatings: parsed.data.categoryRatings,
        photos: parsed.data.photos,
      })
    );
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { communityId: true },
    });
    if (biz) broadcastReviewNew(biz.communityId, review);
    return jsonOk(review, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return jsonError("You already reviewed this business", 409);
    }
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create review", 500);
  }
}
