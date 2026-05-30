import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReviewDto } from "@/types/marketplace";

type ReviewRow = Prisma.ReviewGetPayload<{
  include: { author: { include: { profile: true } } };
}>;

const include = { author: { include: { profile: true } } } as const;

export function mapReview(row: ReviewRow, extras?: { userVotedHelpful?: boolean }): ReviewDto {
  return {
    id: row.id,
    businessId: row.businessId,
    rating: row.rating,
    categoryRatings: (row.categoryRatings as Record<string, number>) ?? null,
    comment: row.comment,
    photos: row.photos,
    helpfulCount: row.helpfulCount,
    verifiedCustomer: row.verifiedCustomer,
    ownerResponse: row.ownerResponse,
    ownerRespondedAt: row.ownerRespondedAt?.toISOString() ?? null,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.author.id,
      displayName: row.author.profile?.displayName ?? "Neighbor",
      avatarUrl: row.author.profile?.avatarUrl,
    },
    userVotedHelpful: extras?.userVotedHelpful,
  };
}

async function refreshBusinessRating(businessId: string) {
  const agg = await prisma.review.aggregate({
    where: { businessId, moderationStatus: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.business.update({
    where: { id: businessId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}

export async function listReviews(businessId: string, userId?: string) {
  const rows = await prisma.review.findMany({
    where: { businessId, moderationStatus: { in: ["APPROVED", "PENDING"] } },
    include,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  let helpfulSet = new Set<string>();
  if (userId && rows.length) {
    const votes = await prisma.reviewHelpfulVote.findMany({
      where: { userId, reviewId: { in: rows.map((r) => r.id) } },
    });
    helpfulSet = new Set(votes.map((v) => v.reviewId));
  }
  return rows.map((r) => mapReview(r, { userVotedHelpful: helpfulSet.has(r.id) }));
}

export async function createReview(data: {
  businessId: string;
  authorId: string;
  rating: number;
  comment?: string;
  categoryRatings?: Record<string, number>;
  photos?: string[];
  verifiedCustomer?: boolean;
}) {
  const row = await prisma.review.create({
    data: {
      businessId: data.businessId,
      authorId: data.authorId,
      rating: data.rating,
      comment: data.comment,
      categoryRatings: data.categoryRatings,
      photos: data.photos ?? [],
      verifiedCustomer: data.verifiedCustomer ?? false,
      moderationStatus: "APPROVED",
    },
    include,
  });
  await refreshBusinessRating(data.businessId);
  return mapReview(row);
}

export async function updateReview(
  id: string,
  authorId: string,
  data: { rating?: number; comment?: string; photos?: string[] }
) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing || existing.authorId !== authorId) return null;
  const row = await prisma.review.update({ where: { id }, data, include });
  await refreshBusinessRating(existing.businessId);
  return mapReview(row);
}

export async function deleteReview(id: string, authorId: string) {
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing || existing.authorId !== authorId) return false;
  await prisma.review.update({
    where: { id },
    data: { moderationStatus: "REMOVED" },
  });
  await refreshBusinessRating(existing.businessId);
  return true;
}

export async function voteHelpful(reviewId: string, userId: string) {
  const existing = await prisma.reviewHelpfulVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });
  if (existing) return { toggled: false, helpfulCount: (await prisma.review.findUnique({ where: { id: reviewId } }))?.helpfulCount ?? 0 };
  await prisma.$transaction([
    prisma.reviewHelpfulVote.create({ data: { reviewId, userId } }),
    prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } }),
  ]);
  const r = await prisma.review.findUnique({ where: { id: reviewId } });
  return { toggled: true, helpfulCount: r?.helpfulCount ?? 0 };
}

export async function reportReview(reviewId: string, userId: string, reason: string, details?: string) {
  await prisma.reviewReport.upsert({
    where: { reviewId_userId: { reviewId, userId } },
    create: { reviewId, userId, reason, details },
    update: { reason, details },
  });
  await prisma.review.update({
    where: { id: reviewId },
    data: { moderationStatus: "FLAGGED" },
  });
  return true;
}

export async function respondToReview(reviewId: string, ownerId: string, response: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { business: true },
  });
  if (!review?.business || review.business.ownerId !== ownerId) return null;
  const row = await prisma.review.update({
    where: { id: reviewId },
    data: { ownerResponse: response, ownerRespondedAt: new Date() },
    include,
  });
  return mapReview(row);
}

export async function moderateReview(id: string, status: "APPROVED" | "FLAGGED" | "REMOVED") {
  const row = await prisma.review.update({
    where: { id },
    data: { moderationStatus: status },
    include,
  });
  await refreshBusinessRating(row.businessId);
  return mapReview(row);
}
