import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export type AnalyticsType =
  | "engagement"
  | "safety"
  | "marketplace"
  | "growth"
  | "moderation";

export async function getPlatformOverview() {
  const [users, communities, posts, alerts, reports, listings, moderationOpen] =
    await Promise.all([
      prisma.user.count(),
      prisma.community.count({ where: { active: true } }),
      prisma.post.count(),
      prisma.safetyAlert.count({ where: { active: true } }),
      prisma.report.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] } } }),
      prisma.marketplaceListing.count({ where: { status: "ACTIVE" } }),
      prisma.moderationCase.count({
        where: { status: { in: ["OPEN", "ASSIGNED", "UNDER_REVIEW"] } },
      }),
    ]);

  return {
    users,
    communities,
    posts,
    activeAlerts: alerts,
    openReports: reports,
    activeListings: listings,
    moderationQueue: moderationOpen,
    generatedAt: new Date().toISOString(),
  };
}

export async function getCommunityAnalytics(
  communityId: string,
  type: AnalyticsType,
  days = 14
) {
  const since = subDays(new Date(), days);

  switch (type) {
    case "engagement": {
      const [posts, comments, reactions] = await Promise.all([
        prisma.post.count({ where: { communityId, createdAt: { gte: since } } }),
        prisma.comment.count({
          where: { post: { communityId }, createdAt: { gte: since } },
        }),
        prisma.reaction.count({
          where: {
            OR: [
              { post: { communityId, createdAt: { gte: since } } },
              { comment: { post: { communityId } }, createdAt: { gte: since } },
            ],
          },
        }),
      ]);
      const series = await buildDailySeries(communityId, days, async (d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const count = await prisma.post.count({
          where: { communityId, createdAt: { gte: d, lt: next } },
        });
        return { posts: count };
      });
      return { posts, comments, reactions, series };
    }
    case "safety": {
      const [alerts, reports] = await Promise.all([
        prisma.safetyAlert.count({ where: { communityId, createdAt: { gte: since } } }),
        prisma.report.count({ where: { communityId, createdAt: { gte: since } } }),
      ]);
      const cached = await prisma.dailySafetyMetrics.findMany({
        where: { communityId, date: { gte: since } },
        orderBy: { date: "asc" },
        take: days,
      });
      return {
        alerts,
        reports,
        series:
          cached.length > 0
            ? cached.map((m) => ({
                date: format(m.date, "yyyy-MM-dd"),
                ...(m.counts as Record<string, number>),
              }))
            : await buildDailySeries(communityId, days, async (d) => {
                const next = new Date(d);
                next.setDate(next.getDate() + 1);
                const alertCount = await prisma.safetyAlert.count({
                  where: { communityId, createdAt: { gte: d, lt: next } },
                });
                const reportCount = await prisma.report.count({
                  where: { communityId, createdAt: { gte: d, lt: next } },
                });
                return { alerts: alertCount, reports: reportCount };
              }),
      };
    }
    case "marketplace": {
      const [listings, inquiries] = await Promise.all([
        prisma.marketplaceListing.count({
          where: { communityId, createdAt: { gte: since } },
        }),
        prisma.inquiry.count({
          where: {
            OR: [
              { listing: { communityId } },
              { business: { communityId } },
            ],
            createdAt: { gte: since },
          },
        }),
      ]);
      return { listings, inquiries, series: [] };
    }
    case "growth": {
      const members = await prisma.communityMember.count({
        where: { communityId, joinedAt: { gte: since } },
      });
      return { newMembers: members, series: [] };
    }
    case "moderation": {
      const [contentReports, cases] = await Promise.all([
        prisma.contentReport.count({
          where: { status: "PENDING", createdAt: { gte: since } },
        }),
        prisma.moderationCase.count({
          where: { communityId, createdAt: { gte: since } },
        }),
      ]);
      return { contentReports, moderationCases: cases, series: [] };
    }
    default:
      return {};
  }
}

async function buildDailySeries(
  communityId: string,
  days: number,
  fn: (day: Date) => Promise<Record<string, number>>
) {
  const out: { date: string; [k: string]: string | number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(subDays(new Date(), i));
    const counts = await fn(d);
    out.push({ date: format(d, "yyyy-MM-dd"), ...counts });
  }
  return out;
}

export async function exportAnalyticsCsv(
  communityId: string,
  type: AnalyticsType
): Promise<string> {
  const data = await getCommunityAnalytics(communityId, type);
  const series = (data as { series?: { date: string }[] }).series ?? [];
  const header = "date," + (series[0] ? Object.keys(series[0]).filter((k) => k !== "date").join(",") : "value");
  const rows = series.map((row) => {
    const r = row as Record<string, string | number>;
    return Object.values(r).join(",");
  });
  return [header, ...rows].join("\n");
}

export function getSystemHealth() {
  return {
    status: "healthy",
    database: process.env.DATABASE_URL ? "configured" : "missing",
    socket: process.env.NEXT_PUBLIC_SOCKET_URL ? "configured" : "default",
    aiModeration: "placeholder",
    mfa: "placeholder",
    cadIntegration: "placeholder",
    checkedAt: new Date().toISOString(),
  };
}
