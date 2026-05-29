import type { PostCategory, PostType, Prisma, ReactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import { extractHashtags, extractMentions, sanitizeText } from "@/lib/api/sanitize";
import type { FeedPost, FeedPoll } from "@/types/feed";

const AUTHOR_SELECT = {
  id: true,
  verified: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

const POST_INCLUDE = {
  author: { select: AUTHOR_SELECT },
  _count: { select: { comments: true, reactions: true } },
  reactions: { select: { type: true, userId: true } },
} as const;

type PostRow = Prisma.PostGetPayload<{ include: typeof POST_INCLUDE }>;

function mapAuthor(author: PostRow["author"]): FeedPost["author"] {
  return {
    id: author.id,
    displayName: author.profile?.displayName ?? "Neighbor",
    avatarUrl: author.profile?.avatarUrl ?? null,
    verified: author.verified,
  };
}

function countByType(reactions: { type: ReactionType }[], type: ReactionType): number {
  return reactions.filter((r) => r.type === type).length;
}

function mapPollData(pollData: unknown, userId?: string): FeedPoll | undefined {
  if (!pollData || typeof pollData !== "object") return undefined;
  const poll = pollData as {
    question: string;
    options: { id: string; label: string; votes: number }[];
    votes?: Record<string, string>;
  };
  if (!poll.question || !Array.isArray(poll.options)) return undefined;
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const votedOptionId = userId && poll.votes?.[userId];
  return { question: poll.question, options: poll.options, totalVotes, votedOptionId };
}

export function mapPostToFeed(post: PostRow, userId?: string, saved = false): FeedPost {
  const userReactions = userId
    ? post.reactions.filter((r) => r.userId === userId).map((r) => r.type)
    : [];
  return {
    id: post.id,
    authorId: post.authorId,
    author: mapAuthor(post.author),
    content: post.content,
    title: post.title,
    type: post.type,
    category: post.category,
    createdAt: post.createdAt.toISOString(),
    mediaUrls: post.mediaUrls,
    videoUrl: post.videoUrl,
    hashtags: post.hashtags,
    locationLabel: post.locationLabel,
    poll: post.type === "POLL" ? mapPollData(post.pollData, userId) : undefined,
    likes: countByType(post.reactions, "LIKE"),
    helpful: countByType(post.reactions, "HELPFUL"),
    support: countByType(post.reactions, "SUPPORT"),
    comments: post._count.comments,
    saved,
    liked: userReactions.includes("LIKE"),
    userReactions,
    shareCount: post.shareCount,
    repostOfId: post.repostOfId,
  };
}

export interface ListPostsParams {
  communityId: string;
  userId?: string;
  sort?: "latest" | "trending";
  category?: PostCategory;
  cursor?: string;
  limit?: number;
}

export async function listPosts(params: ListPostsParams): Promise<{
  items: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const limit = Math.min(params.limit ?? 20, 50);
  const decoded = params.cursor ? decodeCursor(params.cursor) : null;

  const where: Prisma.PostWhereInput = {
    communityId: params.communityId,
    ...(params.category ? { category: params.category } : {}),
    ...(decoded
      ? { createdAt: { lt: new Date(decoded.t) } }
      : {}),
  };

  let posts: PostRow[];

  if (params.sort === "trending") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const candidates = await prisma.post.findMany({
      where: { ...where, createdAt: { gte: sevenDaysAgo } },
      include: POST_INCLUDE,
      take: limit * 3,
      orderBy: { createdAt: "desc" },
    });

    posts = candidates
      .map((p) => {
        const reactionScore = p.reactions.length;
        const commentScore = p._count.comments * 2;
        return { p, score: reactionScore + commentScore };
      })
      .sort((a, b) => b.score - a.score || b.p.createdAt.getTime() - a.p.createdAt.getTime())
      .slice(0, limit + 1)
      .map((x) => x.p);
  } else {
    posts = await prisma.post.findMany({
      where,
      include: POST_INCLUDE,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
    });
  }

  const hasMore = posts.length > limit;
  if (hasMore) posts = posts.slice(0, limit);

  const savedIds = params.userId
    ? new Set(
        (
          await prisma.savedPost.findMany({
            where: { userId: params.userId, postId: { in: posts.map((p) => p.id) } },
            select: { postId: true },
          })
        ).map((s) => s.postId)
      )
    : new Set<string>();

  const items = posts.map((p) => mapPostToFeed(p, params.userId, savedIds.has(p.id)));
  const last = posts[posts.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.id, last.createdAt) : null;

  return { items, nextCursor, hasMore };
}

export interface CreatePostInput {
  communityId: string;
  authorId: string;
  content: string;
  title?: string;
  type?: PostType;
  category?: PostCategory;
  mediaUrls?: string[];
  videoUrl?: string;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  pollData?: { question: string; options: string[] };
}

export async function createPost(input: CreatePostInput) {
  const content = sanitizeText(input.content);
  const hashtags = extractHashtags(content);
  const mentionHandles = extractMentions(content);

  let pollData: Prisma.InputJsonValue | undefined;
  let type = input.type ?? "TEXT";

  if (input.pollData) {
    type = "POLL";
    pollData = {
      question: sanitizeText(input.pollData.question),
      options: input.pollData.options.map((label, i) => ({
        id: `opt-${i}`,
        label: sanitizeText(label),
        votes: 0,
      })),
      votes: {},
    };
  } else if (input.videoUrl) {
    type = "VIDEO";
  } else if (input.mediaUrls?.length) {
    type = "IMAGE";
  }

  return prisma.post.create({
    data: {
      communityId: input.communityId,
      authorId: input.authorId,
      content,
      title: input.title ? sanitizeText(input.title) : undefined,
      type,
      category: input.category ?? "GENERAL",
      mediaUrls: input.mediaUrls ?? [],
      videoUrl: input.videoUrl,
      hashtags,
      mentions: mentionHandles,
      lat: input.lat,
      lng: input.lng,
      locationLabel: input.locationLabel,
      pollData,
    },
    include: POST_INCLUDE,
  });
}

export async function updatePost(
  postId: string,
  authorId: string,
  data: { content?: string; title?: string; category?: PostCategory }
) {
  const post = await prisma.post.findFirst({ where: { id: postId, authorId } });
  if (!post) return null;

  return prisma.post.update({
    where: { id: postId },
    data: {
      ...(data.content !== undefined
        ? {
            content: sanitizeText(data.content),
            hashtags: extractHashtags(data.content),
            mentions: extractMentions(data.content),
          }
        : {}),
      ...(data.title !== undefined ? { title: sanitizeText(data.title) } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
    },
    include: POST_INCLUDE,
  });
}

export async function deletePost(postId: string, authorId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, authorId } });
  if (!post) return false;
  await prisma.post.delete({ where: { id: postId } });
  return true;
}

export async function repostPost(postId: string, authorId: string, communityId: string) {
  const original = await prisma.post.findUnique({ where: { id: postId } });
  if (!original) return null;

  const repost = await prisma.post.create({
    data: {
      communityId,
      authorId,
      content: original.content,
      type: original.type,
      category: original.category,
      mediaUrls: original.mediaUrls,
      videoUrl: original.videoUrl,
      repostOfId: postId,
    },
    include: POST_INCLUDE,
  });

  await prisma.post.update({
    where: { id: postId },
    data: { shareCount: { increment: 1 } },
  });

  return repost;
}

export async function getDefaultCommunityId(userId: string): Promise<string | null> {
  const member = await prisma.communityMember.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { communityId: true },
  });
  return member?.communityId ?? null;
}

export { POST_INCLUDE, mapAuthor };
