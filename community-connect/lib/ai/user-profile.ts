import type { BehaviorEventType } from "@prisma/client";

interface BehaviorRecord {
  eventType: BehaviorEventType;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
}

const EVENT_WEIGHTS: Record<BehaviorEventType, number> = {
  VIEW: 1,
  CLICK: 2,
  SEARCH: 3,
  SAVE: 4,
  SHARE: 3,
  NAVIGATE: 2,
};

const ENTITY_TO_INTEREST: Record<string, string[]> = {
  marketplace: ["marketplace"],
  listing: ["marketplace"],
  deal: ["deals"],
  event: ["events"],
  group: ["community"],
  alert: ["safety"],
  news: ["news"],
  business: ["business", "restaurants"],
  post: ["community"],
  family: ["family"],
};

export interface InferredInterestWeight {
  topic: string;
  weight: number;
}

/** Aggregate UserBehavior into inferred interest weights (rule-based). */
export function aggregateBehaviorWeights(
  behaviors: BehaviorRecord[]
): InferredInterestWeight[] {
  const weights = new Map<string, number>();

  for (const b of behaviors) {
    const eventW = EVENT_WEIGHTS[b.eventType] ?? 1;
    const topics = ENTITY_TO_INTEREST[b.entityType.toLowerCase()] ?? [b.entityType.toLowerCase()];
    for (const topic of topics) {
      weights.set(topic, (weights.get(topic) ?? 0) + eventW);
    }
  }

  return [...weights.entries()]
    .map(([topic, weight]) => ({ topic, weight }))
    .sort((a, b) => b.weight - a.weight);
}

export function mergeInterestWeights(
  explicit: string[],
  inferred: InferredInterestWeight[]
): string[] {
  const scoreMap = new Map<string, number>();
  for (const topic of explicit) scoreMap.set(topic, (scoreMap.get(topic) ?? 0) + 20);
  for (const { topic, weight } of inferred) {
    scoreMap.set(topic, (scoreMap.get(topic) ?? 0) + weight);
  }
  return [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

const OPENAI_ENABLED = Boolean(process.env.OPENAI_API_KEY);

/** Optional OpenAI stub for preference summary; falls back to rule-based text. */
export async function generateProfileSummary(input: {
  interests: string[];
  behaviors: BehaviorRecord[];
  city?: string | null;
}): Promise<{ summary: string; source: "ai" | "rules" }> {
  const inferred = aggregateBehaviorWeights(input.behaviors);
  const merged = mergeInterestWeights(input.interests, inferred);

  if (OPENAI_ENABLED && merged.length > 0) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Write a 1-sentence neighbor profile summary for a local community app.",
          },
          {
            role: "user",
            content: `Interests: ${merged.slice(0, 6).join(", ")}. Location: ${input.city ?? "local area"}.`,
          },
        ],
        max_tokens: 80,
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (text) return { summary: text, source: "ai" };
    } catch {
      // fall through
    }
  }

  const top = merged.slice(0, 3).join(", ");
  const loc = input.city ? ` in ${input.city}` : "";
  return {
    summary: top
      ? `Active neighbor${loc} interested in ${top}.`
      : `New Radius member${loc} exploring the community.`,
    source: "rules",
  };
}

export async function refreshUserAiProfile(userId: string): Promise<{ summary: string; source: string } | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const [profile, interests, behaviors, location] = await Promise.all([
      prisma.personalizationProfile.findUnique({ where: { userId } }),
      prisma.userInterest.findMany({ where: { userId }, select: { topic: true } }),
      prisma.userBehavior.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { eventType: true, entityType: true, entityId: true, metadata: true },
      }),
      prisma.userLocation.findUnique({ where: { userId }, select: { city: true } }),
    ]);

    const explicitInterests = interests.map((i) => i.topic);
    const profileInterests = Array.isArray(profile?.interests)
      ? (profile.interests as string[])
      : [];
    const allInterests = explicitInterests.length > 0 ? explicitInterests : profileInterests;

    const { summary, source } = await generateProfileSummary({
      interests: allInterests,
      behaviors,
      city: location?.city,
    });

    await prisma.personalizationProfile.upsert({
      where: { userId },
      update: { aiProfileSummary: summary },
      create: { userId, interests: allInterests, preferences: {}, aiProfileSummary: summary },
    });

    return { summary, source };
  } catch {
    return null;
  }
}
