import type { FollowTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function follow(followerId: string, targetType: FollowTargetType, targetId: string) {
  return prisma.follow.upsert({
    where: { followerId_targetType_targetId: { followerId, targetType, targetId } },
    create: { followerId, targetType, targetId },
    update: {},
  });
}

export async function unfollow(followerId: string, targetType: FollowTargetType, targetId: string) {
  await prisma.follow.deleteMany({ where: { followerId, targetType, targetId } });
}

export async function getFollowers(targetType: FollowTargetType, targetId: string) {
  const follows = await prisma.follow.findMany({
    where: { targetType, targetId },
    include: {
      follower: {
        select: {
          id: true,
          verified: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return follows.map((f) => ({
    id: f.follower.id,
    displayName: f.follower.profile?.displayName ?? "Neighbor",
    avatarUrl: f.follower.profile?.avatarUrl,
    verified: f.follower.verified,
    followedAt: f.createdAt.toISOString(),
  }));
}

export async function getFollowing(followerId: string, targetType?: FollowTargetType) {
  const follows = await prisma.follow.findMany({
    where: { followerId, ...(targetType ? { targetType } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return follows.map((f) => ({
    targetType: f.targetType,
    targetId: f.targetId,
    followedAt: f.createdAt.toISOString(),
  }));
}

export async function isFollowing(
  followerId: string,
  targetType: FollowTargetType,
  targetId: string
): Promise<boolean> {
  const count = await prisma.follow.count({
    where: { followerId, targetType, targetId },
  });
  return count > 0;
}
