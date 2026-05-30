import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

export const ACTIVE_COMMUNITY_COOKIE = "cc_community";

export async function getActiveCommunityId(
  userId: string,
  req?: NextRequest
): Promise<string | null> {
  const fromQuery = req?.nextUrl.searchParams.get("communityId");
  if (fromQuery) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: fromQuery, userId } },
    });
    if (member?.status === "ACTIVE") return fromQuery;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ACTIVE_COMMUNITY_COOKIE)?.value;
  if (fromCookie) {
    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: fromCookie, userId } },
    });
    if (member?.status === "ACTIVE") return fromCookie;
  }

  return getDefaultCommunityId(userId);
}

export async function assertCommunityAccess(
  userId: string,
  communityId: string,
  role?: import("@prisma/client").UserRole
): Promise<boolean> {
  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  if (!member || member.status !== "ACTIVE") return false;
  if (role) {
    const { hasMinRole } = await import("@/lib/permissions/rbac");
    return hasMinRole(member.role, role);
  }
  return true;
}
