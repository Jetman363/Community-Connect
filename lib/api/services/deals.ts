import { prisma } from "@/lib/prisma";
import { mockDeals, getExpiringDeals } from "@/lib/mock-data/deals";
import type { DealDto } from "@/types/engagement";

function mapDeal(
  d: {
    id: string;
    title: string;
    description: string | null;
    discount: string;
    dealType: DealDto["dealType"];
    expiresAt: Date;
    redeemedCount: number;
    imageUrl: string | null;
    businessId: string;
    business?: { name: string } | null;
  },
  saved?: boolean
): DealDto {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    discount: d.discount,
    dealType: d.dealType,
    expiresAt: d.expiresAt.toISOString(),
    redeemedCount: d.redeemedCount,
    imageUrl: d.imageUrl,
    businessId: d.businessId,
    businessName: d.business?.name,
    saved,
  };
}

export async function listDeals(input: {
  communityId?: string;
  userId?: string;
  expiringSoon?: boolean;
}): Promise<{ items: DealDto[]; source: "db" | "mock" }> {
  try {
    const where = {
      ...(input.communityId ? { communityId: input.communityId } : {}),
      ...(input.expiringSoon
        ? { expiresAt: { lte: new Date(Date.now() + 7 * 86400000) } }
        : {}),
    };
    const deals = await prisma.localDeal.findMany({
      where,
      include: { business: { select: { name: true } } },
      orderBy: { expiresAt: "asc" },
      take: 50,
    });
    if (deals.length === 0) {
      return {
        items: input.expiringSoon ? getExpiringDeals() : mockDeals,
        source: "mock",
      };
    }

    let savedIds = new Set<string>();
    if (input.userId) {
      const saved = await prisma.savedDeal.findMany({
        where: { userId: input.userId, dealId: { in: deals.map((d) => d.id) } },
        select: { dealId: true },
      });
      savedIds = new Set(saved.map((s) => s.dealId));
    }

    return {
      items: deals.map((d) => mapDeal(d, savedIds.has(d.id))),
      source: "db",
    };
  } catch {
    return {
      items: input.expiringSoon ? getExpiringDeals() : mockDeals,
      source: "mock",
    };
  }
}

export async function saveDeal(dealId: string, userId: string) {
  try {
    await prisma.savedDeal.upsert({
      where: { userId_dealId: { userId, dealId } },
      update: {},
      create: { userId, dealId },
    });
    return { saved: true, source: "db" as const };
  } catch {
    return { saved: true, source: "mock" as const };
  }
}

export async function redeemDeal(dealId: string, userId: string) {
  const code = `DEAL-${dealId.slice(-4).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  try {
    await prisma.dealRedemption.create({ data: { userId, dealId, code } });
    await prisma.localDeal.update({
      where: { id: dealId },
      data: { redeemedCount: { increment: 1 } },
    });
    await prisma.pointTransaction.create({
      data: { userId, amount: 25, reason: "DEAL_REDEMPTION" },
    });
    return { redeemed: true, code, pointsEarned: 25, source: "db" as const };
  } catch {
    return { redeemed: true, code, pointsEarned: 25, source: "mock" as const };
  }
}
