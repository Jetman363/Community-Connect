import { prisma } from "@/lib/prisma";
import { mockDiscoverFeed, mockTrendingItems } from "@/lib/mock-data/discover";
import { mockChallenges } from "@/lib/mock-data/challenges";
import { mockNewsArticles } from "@/lib/mock-data/news";
import { mockDeals } from "@/lib/mock-data/deals";
import { mockEvents } from "@/lib/mock-data/events";
import type { DiscoverFeedItem, TrendingItemDto } from "@/types/engagement";
import { getPersonalizationProfile } from "./personalization";

export async function getDiscoverFeed(input: {
  userId?: string;
  communityId?: string;
  category?: string;
  cursor?: number;
  limit?: number;
}): Promise<{ items: DiscoverFeedItem[]; nextCursor: number | null; source: "db" | "mock" }> {
  const limit = input.limit ?? 10;
  const offset = input.cursor ?? 0;

  try {
    const profile = input.userId
      ? await getPersonalizationProfile(input.userId)
      : { interests: [] as string[], preferences: {}, source: "mock" as const };

    const [trending, challenges, news, deals] = await Promise.all([
      prisma.trendingItem.findMany({
        where: input.communityId ? { communityId: input.communityId, period: "DAY" } : { period: "DAY" },
        orderBy: { score: "desc" },
        take: 20,
      }),
      prisma.communityChallenge.findMany({
        where: input.communityId ? { communityId: input.communityId } : {},
        take: 5,
      }),
      prisma.newsArticle.findMany({
        where: input.communityId ? { communityId: input.communityId } : {},
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),
      prisma.localDeal.findMany({
        where: input.communityId ? { communityId: input.communityId } : {},
        orderBy: { expiresAt: "asc" },
        take: 5,
        include: { business: { select: { name: true } } },
      }),
    ]);

    if (trending.length === 0 && challenges.length === 0) {
      let items = [...mockDiscoverFeed];
      if (input.category && input.category !== "all") {
        items = items.filter((i) => i.type === input.category);
      }
      if (profile.interests.length > 0) {
        items = scoreByInterests(items, profile.interests);
      }
      const page = items.slice(offset, offset + limit);
      return {
        items: page,
        nextCursor: offset + limit < items.length ? offset + limit : null,
        source: "mock",
      };
    }

    const feed: DiscoverFeedItem[] = [
      ...deals.map((d) => ({
        id: d.id,
        type: "deal" as const,
        title: d.title,
        subtitle: d.business.name,
        imageUrl: d.imageUrl ?? undefined,
        score: 85,
        href: `/deals`,
      })),
      ...news.map((n) => ({
        id: n.id,
        type: "news" as const,
        title: n.title,
        subtitle: n.source,
        imageUrl: n.imageUrl ?? undefined,
        score: 80,
        href: `/news`,
      })),
      ...challenges.map((c) => ({
        id: c.id,
        type: "challenge" as const,
        title: c.title,
        subtitle: `${c.participantCount} participating`,
        imageUrl: c.imageUrl ?? undefined,
        score: 75,
        href: `/challenges`,
      })),
    ];

    if (profile.interests.length > 0) {
      scoreByInterests(feed, profile.interests);
    }

    feed.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const page = feed.slice(offset, offset + limit);
    return {
      items: page,
      nextCursor: offset + limit < feed.length ? offset + limit : null,
      source: "db",
    };
  } catch {
    let items = [...mockDiscoverFeed];
    if (input.category && input.category !== "all") {
      items = items.filter((i) => i.type === input.category);
    }
    const page = items.slice(offset, offset + limit);
    return {
      items: page,
      nextCursor: offset + limit < items.length ? offset + limit : null,
      source: "mock",
    };
  }
}

function scoreByInterests(items: DiscoverFeedItem[], interests: string[]): DiscoverFeedItem[] {
  const lower = interests.map((i) => i.toLowerCase());
  return items
    .map((item) => {
      let boost = 0;
      const text = `${item.title} ${item.subtitle ?? ""}`.toLowerCase();
      for (const interest of lower) {
        if (text.includes(interest)) boost += 10;
      }
      return { ...item, score: (item.score ?? 50) + boost };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export async function getTrending(input: {
  communityId?: string;
  period?: "DAY" | "WEEK" | "MONTH";
}): Promise<{ items: TrendingItemDto[]; source: "db" | "mock" }> {
  try {
    const items = await prisma.trendingItem.findMany({
      where: {
        ...(input.communityId ? { communityId: input.communityId } : {}),
        period: input.period ?? "DAY",
      },
      orderBy: { score: "desc" },
      take: 20,
    });
    if (items.length === 0) return { items: mockTrendingItems, source: "mock" };
    return {
      items: items.map((t) => ({
        id: t.id,
        entityType: t.entityType,
        entityId: t.entityId,
        score: t.score,
        period: t.period,
      })),
      source: "db",
    };
  } catch {
    return { items: mockTrendingItems, source: "mock" };
  }
}

export async function listChallenges(input: {
  communityId?: string;
  userId?: string;
}) {
  try {
    const challenges = await prisma.communityChallenge.findMany({
      where: input.communityId ? { communityId: input.communityId } : {},
      orderBy: { endDate: "asc" },
    });
    if (challenges.length === 0) return { items: mockChallenges, source: "mock" as const };

    let joined = new Set<string>();
    if (input.userId) {
      const parts = await prisma.challengeParticipation.findMany({
        where: { userId: input.userId },
      });
      joined = new Set(parts.map((p) => p.challengeId));
    }

    return {
      items: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        endDate: c.endDate.toISOString(),
        participantCount: c.participantCount,
        milestone: c.milestone,
        imageUrl: c.imageUrl,
        joined: joined.has(c.id),
      })),
      source: "db" as const,
    };
  } catch {
    return { items: mockChallenges, source: "mock" as const };
  }
}

export async function joinChallenge(challengeId: string, userId: string) {
  try {
    await prisma.challengeParticipation.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: {},
      create: { userId, challengeId, progress: 0 },
    });
    await prisma.communityChallenge.update({
      where: { id: challengeId },
      data: { participantCount: { increment: 1 } },
    });
    return { joined: true, source: "db" as const };
  } catch {
    return { joined: true, source: "mock" as const };
  }
}

export async function listNews(input: { communityId?: string; category?: string }) {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        ...(input.communityId ? { communityId: input.communityId } : {}),
        ...(input.category ? { category: input.category } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });
    if (articles.length === 0) {
      let items = mockNewsArticles;
      if (input.category) items = items.filter((a) => a.category === input.category);
      return { items, source: "mock" as const };
    }
    return {
      items: articles.map((a) => ({
        id: a.id,
        title: a.title,
        source: a.source,
        summary: a.summary,
        category: a.category,
        publishedAt: a.publishedAt.toISOString(),
        imageUrl: a.imageUrl,
        url: a.url,
        aiSummary: a.summary.slice(0, 120) + "...",
      })),
      source: "db" as const,
    };
  } catch {
    return { items: mockNewsArticles, source: "mock" as const };
  }
}
