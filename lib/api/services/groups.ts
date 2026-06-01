import { prisma } from "@/lib/prisma";
import { mockGroups, mockGroupPosts } from "@/lib/mock-data/groups";
import type { GroupDto } from "@/types/engagement";

export async function listGroups(input: {
  communityId?: string;
  category?: string;
  userId?: string;
}): Promise<{ items: GroupDto[]; source: "db" | "mock" }> {
  try {
    const groups = await prisma.communityGroup.findMany({
      where: {
        ...(input.communityId ? { communityId: input.communityId } : {}),
        ...(input.category ? { category: input.category } : {}),
      },
      orderBy: { memberCount: "desc" },
      take: 50,
      include: input.userId
        ? { members: { where: { userId: input.userId }, select: { role: true } } }
        : undefined,
    });

    if (groups.length === 0) return { items: mockGroups, source: "mock" };

    return {
      items: groups.map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        description: g.description,
        coverPhoto: g.coverPhoto,
        memberCount: g.memberCount,
        isPrivate: g.isPrivate,
        isMember: (g as { members?: { role: string }[] }).members?.length ? true : false,
        role: (g as { members?: { role: "MODERATOR" | "MEMBER" }[] }).members?.[0]?.role,
      })),
      source: "db",
    };
  } catch {
    return { items: mockGroups, source: "mock" };
  }
}

export async function getGroup(id: string, userId?: string) {
  try {
    const group = await prisma.communityGroup.findUnique({
      where: { id },
      include: {
        members: userId ? { where: { userId: userId } } : false,
        posts: { orderBy: { createdAt: "desc" }, take: 20, include: { post: true } },
      },
    });
    if (!group) {
      const mock = mockGroups.find((g) => g.id === id);
      if (!mock) return null;
      return {
        group: mock,
        posts: mockGroupPosts.filter((p) => p.groupId === id),
        source: "mock" as const,
      };
    }
    return {
      group: {
        id: group.id,
        name: group.name,
        category: group.category,
        description: group.description,
        coverPhoto: group.coverPhoto,
        memberCount: group.memberCount,
        isPrivate: group.isPrivate,
        isMember: group.members.length > 0,
        role: group.members[0]?.role,
      },
      posts: group.posts.map((p) => ({
        id: p.id,
        content: p.content ?? p.post?.content ?? "",
        createdAt: p.createdAt.toISOString(),
      })),
      source: "db" as const,
    };
  } catch {
    const mock = mockGroups.find((g) => g.id === id);
    if (!mock) return null;
    return {
      group: mock,
      posts: mockGroupPosts.filter((p) => p.groupId === id),
      source: "mock" as const,
    };
  }
}

export async function joinGroup(groupId: string, userId: string) {
  try {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {},
      create: { userId, groupId, role: "MEMBER" },
    });
    await prisma.communityGroup.update({
      where: { id: groupId },
      data: { memberCount: { increment: 1 } },
    });
    return { joined: true, source: "db" as const };
  } catch {
    return { joined: true, source: "mock" as const };
  }
}

export async function leaveGroup(groupId: string, userId: string) {
  try {
    await prisma.groupMember.deleteMany({ where: { userId, groupId } });
    await prisma.communityGroup.update({
      where: { id: groupId },
      data: { memberCount: { decrement: 1 } },
    });
    return { left: true, source: "db" as const };
  } catch {
    return { left: true, source: "mock" as const };
  }
}
