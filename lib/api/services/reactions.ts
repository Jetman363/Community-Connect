import type { ReactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function togglePostReaction(postId: string, userId: string, type: ReactionType = "LIKE") {
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { action: "removed" as const, type };
  }

  await prisma.reaction.create({ data: { postId, userId, type } });
  return { action: "added" as const, type };
}

export async function removePostReaction(postId: string, userId: string, type: ReactionType = "LIKE") {
  await prisma.reaction.deleteMany({ where: { postId, userId, type } });
}

export async function toggleCommentReaction(commentId: string, userId: string, type: ReactionType = "LIKE") {
  const existing = await prisma.reaction.findUnique({
    where: { commentId_userId_type: { commentId, userId, type } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { action: "removed" as const, type };
  }

  await prisma.reaction.create({ data: { commentId, userId, type } });
  return { action: "added" as const, type };
}

export async function removeCommentReaction(commentId: string, userId: string, type: ReactionType = "LIKE") {
  await prisma.reaction.deleteMany({ where: { commentId, userId, type } });
}

export async function getPostReactionCounts(postId: string) {
  const reactions = await prisma.reaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: true,
  });
  return Object.fromEntries(reactions.map((r) => [r.type, r._count]));
}
