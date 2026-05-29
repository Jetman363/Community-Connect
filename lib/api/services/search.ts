import { prisma } from "@/lib/prisma";

export async function searchAll(query: string, communityId?: string, limit = 20) {
  const q = query.trim();
  if (q.length < 2) {
    return { posts: [], users: [], hashtags: [] };
  }

  const hashtag = q.startsWith("#") ? q.slice(1).toLowerCase() : null;

  const [posts, users, hashtagPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        ...(communityId ? { communityId } : {}),
        OR: [
          { content: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        content: true,
        category: true,
        createdAt: true,
        author: { select: { profile: { select: { displayName: true } } } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { profile: { displayName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        verified: true,
        profile: { select: { displayName: true, avatarUrl: true, neighborhood: true } },
      },
      take: limit,
    }),
    hashtag
      ? prisma.post.findMany({
          where: {
            ...(communityId ? { communityId } : {}),
            hashtags: { has: hashtag },
          },
          select: { id: true, content: true, hashtags: true, createdAt: true },
          take: limit,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const tagMatches = hashtag
    ? [{ tag: hashtag, count: hashtagPosts.length }]
    : (
        await prisma.post.findMany({
          where: {
            ...(communityId ? { communityId } : {}),
            hashtags: { hasSome: [q.toLowerCase().replace(/^#/, "")] },
          },
          select: { hashtags: true },
          take: 100,
        })
      )
        .flatMap((p) => p.hashtags)
        .filter((t) => t.includes(q.toLowerCase().replace(/^#/, "")))
        .reduce(
          (acc, tag) => {
            acc[tag] = (acc[tag] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

  const hashtags = Array.isArray(tagMatches)
    ? tagMatches
    : Object.entries(tagMatches).map(([tag, count]) => ({ tag, count }));

  return {
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content.slice(0, 200),
      category: p.category,
      authorName: p.author.profile?.displayName,
      createdAt: p.createdAt.toISOString(),
    })),
    users: users.map((u) => ({
      id: u.id,
      displayName: u.profile?.displayName ?? "Neighbor",
      avatarUrl: u.profile?.avatarUrl,
      neighborhood: u.profile?.neighborhood,
      verified: u.verified,
    })),
    hashtags,
  };
}
