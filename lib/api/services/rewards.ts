import { prisma } from "@/lib/prisma";
import {
  mockPoints,
  mockAchievements,
  mockLeaderboard,
} from "@/lib/mock-data/rewards";
import type { AchievementDto, LeaderboardEntry, PointsDto } from "@/types/engagement";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

function levelFromBalance(balance: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (balance >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

function nextLevelAt(balance: number): number {
  const level = levelFromBalance(balance);
  return LEVEL_THRESHOLDS[level] ?? balance + 500;
}

export async function getPoints(userId: string): Promise<PointsDto & { source: "db" | "mock" }> {
  try {
    const [points, lastCheckIn] = await Promise.all([
      prisma.communityPoints.findUnique({ where: { userId } }),
      prisma.dailyCheckIn.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
      }),
    ]);
    if (!points) return { ...mockPoints, source: "mock" };
    return {
      balance: points.balance,
      level: points.level,
      streak: lastCheckIn?.streak ?? 0,
      nextLevelAt: nextLevelAt(points.balance),
      source: "db",
    };
  } catch {
    return { ...mockPoints, source: "mock" };
  }
}

export async function getAchievements(userId: string): Promise<{
  items: AchievementDto[];
  source: "db" | "mock";
}> {
  try {
    const [all, earned] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);
    if (all.length === 0) return { items: mockAchievements, source: "mock" };
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
    return {
      items: all.map((a) => ({
        id: a.id,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        points: a.points,
        earned: earnedMap.has(a.id),
        earnedAt: earnedMap.get(a.id)?.toISOString(),
      })),
      source: "db",
    };
  } catch {
    return { items: mockAchievements, source: "mock" };
  }
}

export async function getLeaderboard(limit = 10): Promise<{
  items: LeaderboardEntry[];
  source: "db" | "mock";
}> {
  try {
    const rows = await prisma.communityPoints.findMany({
      orderBy: { balance: "desc" },
      take: limit,
      include: { user: { include: { profile: true } } },
    });
    if (rows.length === 0) return { items: mockLeaderboard.slice(0, limit), source: "mock" };
    return {
      items: rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        displayName: r.user.profile?.displayName ?? "Neighbor",
        avatar: r.user.profile?.displayName?.slice(0, 2).toUpperCase(),
        balance: r.balance,
        level: r.level,
      })),
      source: "db",
    };
  } catch {
    return { items: mockLeaderboard.slice(0, limit), source: "mock" };
  }
}

export async function dailyCheckIn(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    const existing = await prisma.dailyCheckIn.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) {
      return { alreadyCheckedIn: true, streak: existing.streak, pointsEarned: 0, source: "db" as const };
    }

    const prev = await prisma.dailyCheckIn.findUnique({
      where: { userId_date: { userId, date: yesterday } },
    });
    const streak = prev ? prev.streak + 1 : 1;
    const pointsEarned = 10 + Math.min(streak, 7) * 5;

    await prisma.dailyCheckIn.create({ data: { userId, date: today, streak } });
    await prisma.communityPoints.upsert({
      where: { userId },
      update: { balance: { increment: pointsEarned }, level: { set: levelFromBalance(0) } },
      create: { userId, balance: pointsEarned, level: 1 },
    });
    await prisma.pointTransaction.create({
      data: { userId, amount: pointsEarned, reason: "CHECK_IN" },
    });

    const updated = await prisma.communityPoints.findUnique({ where: { userId } });
    if (updated) {
      const newLevel = levelFromBalance(updated.balance);
      if (newLevel !== updated.level) {
        await prisma.communityPoints.update({
          where: { userId },
          data: { level: newLevel },
        });
      }
    }

    return { alreadyCheckedIn: false, streak, pointsEarned, source: "db" as const };
  } catch {
    return {
      alreadyCheckedIn: false,
      streak: mockPoints.streak + 1,
      pointsEarned: 45,
      source: "mock" as const,
    };
  }
}
