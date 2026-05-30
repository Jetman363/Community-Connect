import { prisma } from "@/lib/prisma";

export async function getSafetyAnalytics(communityId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeAlerts, openReports, reportsByCategory, alertsBySeverity, recentReports] =
    await Promise.all([
      prisma.safetyAlert.count({ where: { communityId, active: true } }),
      prisma.report.count({
        where: { communityId, status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] } },
      }),
      prisma.report.groupBy({
        by: ["category"],
        where: { communityId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.safetyAlert.groupBy({
        by: ["severity"],
        where: { communityId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.report.findMany({
        where: { communityId, lat: { not: null }, lng: { not: null } },
        select: { lat: true, lng: true, category: true, title: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const hotspots = aggregateHotspots(recentReports);

  return {
    activeAlerts,
    openReports,
    reportsByCategory: reportsByCategory.map((r) => ({
      category: r.category,
      count: r._count,
    })),
    alertsBySeverity: alertsBySeverity.map((a) => ({
      severity: a.severity,
      count: a._count,
    })),
    hotspots,
  };
}

function aggregateHotspots(
  points: { lat: number | null; lng: number | null; category: string; title: string }[]
) {
  const grid = new Map<string, { lat: number; lng: number; count: number; labels: string[] }>();
  for (const p of points) {
    if (p.lat == null || p.lng == null) continue;
    const key = `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
    const existing = grid.get(key);
    if (existing) {
      existing.count += 1;
      if (existing.labels.length < 3) existing.labels.push(p.title);
    } else {
      grid.set(key, { lat: p.lat, lng: p.lng, count: 1, labels: [p.title] });
    }
  }
  return [...grid.values()].sort((a, b) => b.count - a.count).slice(0, 10);
}
