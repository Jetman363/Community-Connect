import { prisma } from "@/lib/prisma";
import { POST_INCLUDE, mapPostToFeed } from "@/lib/api/services/posts";

export async function getUserProfile(userId: string, viewerId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
      profile: true,
      _count: {
        select: { posts: true },
      },
    },
  });
  if (!user) return null;

  const followerCount = await prisma.follow.count({
    where: { targetType: "USER", targetId: userId },
  });
  const followingCount = await prisma.follow.count({
    where: { followerId: userId },
  });

  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    isFollowing =
      (await prisma.follow.count({
        where: { followerId: viewerId, targetType: "USER", targetId: userId },
      })) > 0;
  }

  return {
    id: user.id,
    email: viewerId === userId ? user.email : undefined,
    role: user.role,
    verified: user.verified,
    displayName: user.profile?.displayName ?? "Neighbor",
    avatarUrl: user.profile?.avatarUrl,
    bio: user.profile?.bio,
    neighborhood: user.profile?.neighborhood,
    badges: user.profile?.badges ?? [],
    joinedAt: user.createdAt.toISOString(),
    postCount: user._count.posts,
    followerCount,
    followingCount,
    isFollowing,
  };
}

export async function getUserActivity(userId: string, limit = 20) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: POST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return posts.map((p) => mapPostToFeed(p, userId));
}
