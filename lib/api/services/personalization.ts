import { prisma } from "@/lib/prisma";
import type { PersonalizationProfileDto } from "@/types/engagement";

const DEFAULT_INTERESTS = ["events", "deals", "family", "outdoors", "food"];

export async function getPersonalizationProfile(
  userId: string
): Promise<PersonalizationProfileDto & { source: "db" | "mock" }> {
  try {
    const [profile, interests] = await Promise.all([
      prisma.personalizationProfile.findUnique({ where: { userId } }),
      prisma.userInterest.findMany({ where: { userId }, select: { topic: true } }),
    ]);

    if (!profile && interests.length === 0) {
      return {
        interests: ["events", "deals", "family"],
        preferences: { feedDensity: "normal", showSafetyAlerts: "compact" },
        source: "mock",
      };
    }

    const profileInterests = profile?.interests;
    const parsedInterests = Array.isArray(profileInterests)
      ? (profileInterests as string[])
      : interests.map((i) => i.topic);

    return {
      interests: parsedInterests.length > 0 ? parsedInterests : DEFAULT_INTERESTS.slice(0, 3),
      preferences: (profile?.preferences as Record<string, unknown>) ?? {},
      source: "db",
    };
  } catch {
    return {
      interests: ["events", "deals", "family"],
      preferences: { feedDensity: "normal", showSafetyAlerts: "compact" },
      source: "mock",
    };
  }
}

export async function updateInterests(userId: string, interests: string[]) {
  try {
    await prisma.personalizationProfile.upsert({
      where: { userId },
      update: { interests },
      create: { userId, interests, preferences: {} },
    });
    await prisma.userInterest.deleteMany({ where: { userId } });
    if (interests.length > 0) {
      await prisma.userInterest.createMany({
        data: interests.map((topic) => ({ userId, topic })),
      });
    }
    return { interests, source: "db" as const };
  } catch {
    return { interests, source: "mock" as const };
  }
}

export function getRecommendationsForInterests(
  interests: string[],
  context: { hour?: number; dayOfWeek?: number } = {}
): string[] {
  const hour = context.hour ?? new Date().getHours();
  const tags: string[] = [];

  if (interests.includes("food") || interests.includes("dining")) {
    tags.push(hour >= 17 ? "dinner" : "lunch");
  }
  if (interests.includes("family")) tags.push("family-activities");
  if (interests.includes("outdoors")) tags.push("parks", "hiking");
  if (interests.includes("events")) tags.push("tonight-events");
  if (interests.includes("deals")) tags.push("expiring-deals");
  if (interests.includes("social")) tags.push("groups", "meetups");

  return tags.length > 0 ? tags : ["events", "deals"];
}
