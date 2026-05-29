import type { ReactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/api/sanitize";
import type { FeedComment } from "@/types/feed";
import { mapAuthor } from "@/lib/api/services/posts";

const COMMENT_AUTHOR = {
  id: true,
  verified: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

function mapComment(
  c: {
    id: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    content: string;
    createdAt: Date;
    author: { id: string; verified: boolean; profile: { displayName: string; avatarUrl: string | null } | null };
    reactions: { userId: string; type: ReactionType }[];
    _count: { replies: number };
  },
  userId?: string
): FeedComment {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    author: mapAuthor(c.author),
    parentId: c.parentId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    likes: c.reactions.filter((r) => r.type === "LIKE").length,
    liked: userId ? c.reactions.some((r) => r.userId === userId && r.type === "LIKE") : false,
    replyCount: c._count.replies,
  };
}

export async function listComments(postId: string, userId?: string, parentId?: string | null) {
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: parentId ?? null },
    include: {
      author: { select: COMMENT_AUTHOR },
      reactions: { select: { userId: true, type: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return comments.map((c) => mapComment(c, userId));
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}) {
  const content = sanitizeText(input.content);
  return prisma.comment.create({
    data: {
      postId: input.postId,
      authorId: input.authorId,
      content,
      parentId: input.parentId,
    },
    include: {
      author: { select: COMMENT_AUTHOR },
      reactions: { select: { userId: true, type: true } },
      _count: { select: { replies: true } },
    },
  });
}

export async function updateComment(commentId: string, authorId: string, content: string) {
  const existing = await prisma.comment.findFirst({ where: { id: commentId, authorId } });
  if (!existing) return null;
  return prisma.comment.update({
    where: { id: commentId },
    data: { content: sanitizeText(content) },
    include: {
      author: { select: COMMENT_AUTHOR },
      reactions: { select: { userId: true, type: true } },
      _count: { select: { replies: true } },
    },
  });
}

export async function deleteComment(commentId: string, authorId: string) {
  const existing = await prisma.comment.findFirst({ where: { id: commentId, authorId } });
  if (!existing) return false;
  await prisma.comment.delete({ where: { id: commentId } });
  return true;
}

export { mapComment };
