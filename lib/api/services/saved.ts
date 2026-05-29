import { prisma } from "@/lib/prisma";
import { listPosts, mapPostToFeed, POST_INCLUDE } from "@/lib/api/services/posts";

export async function savePost(userId: string, postId: string) {
  return prisma.savedPost.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });
}

export async function unsavePost(userId: string, postId: string) {
  await prisma.savedPost.deleteMany({ where: { userId, postId } });
}

export async function listSavedPosts(userId: string) {
  const saved = await prisma.savedPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { post: { include: POST_INCLUDE } },
  });
  return saved.map((s) => mapPostToFeed(s.post, userId, true));
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  const count = await prisma.savedPost.count({ where: { userId, postId } });
  return count > 0;
}

export { listPosts };
