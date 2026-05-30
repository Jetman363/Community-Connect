import type { SocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SocialLinkDto } from "@/types/social";

export function mapSocialLink(row: {
  id: string;
  platform: SocialPlatform;
  profileUrl: string;
  username: string | null;
  connectedAt: Date;
  isPublic: boolean;
}): SocialLinkDto {
  return {
    id: row.id,
    platform: row.platform,
    profileUrl: row.profileUrl,
    username: row.username,
    connectedAt: row.connectedAt.toISOString(),
    isPublic: row.isPublic,
  };
}

export async function listUserSocialLinks(userId: string): Promise<SocialLinkDto[]> {
  const rows = await prisma.userSocialLink.findMany({
    where: { userId },
    orderBy: { platform: "asc" },
  });
  return rows.map(mapSocialLink);
}

export async function listPublicSocialLinks(userId: string): Promise<SocialLinkDto[]> {
  const rows = await prisma.userSocialLink.findMany({
    where: { userId, isPublic: true },
    orderBy: { platform: "asc" },
  });
  return rows.map(mapSocialLink);
}

export async function connectSocialLink(
  userId: string,
  data: { platform: SocialPlatform; profileUrl: string; username?: string; isPublic?: boolean }
): Promise<SocialLinkDto> {
  const row = await prisma.userSocialLink.upsert({
    where: { userId_platform: { userId, platform: data.platform } },
    create: {
      userId,
      platform: data.platform,
      profileUrl: data.profileUrl,
      username: data.username ?? null,
      isPublic: data.isPublic ?? true,
    },
    update: {
      profileUrl: data.profileUrl,
      username: data.username ?? null,
      connectedAt: new Date(),
      ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
    },
  });
  return mapSocialLink(row);
}

export async function disconnectSocialLink(
  userId: string,
  platform: SocialPlatform
): Promise<boolean> {
  const result = await prisma.userSocialLink.deleteMany({
    where: { userId, platform },
  });
  return result.count > 0;
}

export async function patchSocialLinks(
  userId: string,
  patch: { isPublic?: boolean; platforms?: { platform: SocialPlatform; isPublic: boolean }[] }
): Promise<SocialLinkDto[]> {
  if (patch.isPublic !== undefined) {
    await prisma.userSocialLink.updateMany({
      where: { userId },
      data: { isPublic: patch.isPublic },
    });
  }
  if (patch.platforms?.length) {
    await Promise.all(
      patch.platforms.map((p) =>
        prisma.userSocialLink.updateMany({
          where: { userId, platform: p.platform },
          data: { isPublic: p.isPublic },
        })
      )
    );
  }
  return listUserSocialLinks(userId);
}
