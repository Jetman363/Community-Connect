import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api/response";
import { getPersonalizationProfile } from "@/lib/api/services/personalization";
import { getUserPreferences } from "@/lib/api/services/radius-user";
import { rankMobileNav, rankSidebarNav } from "@/lib/personalization/navigation-ranker";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  let interests = ["events", "deals", "community"];
  let menuLocked = false;
  let navOrder: string[] | null = null;
  let behaviors: Array<{ entityType: string; count: number }> = [];

  if (userId) {
    const [profile, prefs] = await Promise.all([
      getPersonalizationProfile(userId),
      getUserPreferences(userId),
    ]);
    interests = profile.interests;
    menuLocked = prefs.menuLocked;
    navOrder = prefs.navOrder ?? null;

    try {
      const rows = await prisma.userBehavior.groupBy({
        by: ["entityType"],
        where: { userId },
        _count: { entityType: true },
      });
      behaviors = rows.map((r) => ({ entityType: r.entityType, count: r._count.entityType }));
    } catch {
      // mock fallback
    }
  }

  const input = { interests, menuLocked, navOrder, behaviors };
  return jsonOk({
    sidebarOrder: rankSidebarNav(input).map((item) => item.href),
    mobileOrder: rankMobileNav(input).map((item) => item.href),
    interests,
    menuLocked,
  });
}
