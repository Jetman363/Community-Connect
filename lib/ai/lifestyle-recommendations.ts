import { mockDeals } from "@/lib/mock-data/deals";
import { mockEvents } from "@/lib/mock-data/events";
import { mockGroups } from "@/lib/mock-data/groups";
import { communityPhotos } from "@/lib/images/community-photos";
import type { LifestyleRecommendation } from "@/types/engagement";
import { getRecommendationsForInterests } from "@/lib/api/services/personalization";

const OPENAI_ENABLED = Boolean(process.env.OPENAI_API_KEY);

export async function getLifestyleRecommendations(input: {
  interests?: string[];
  lat?: number;
  lng?: number;
}): Promise<{ items: LifestyleRecommendation[]; source: "ai" | "rules" | "mock" }> {
  const interests = input.interests ?? ["events", "deals", "family"];
  const hour = new Date().getHours();
  const isEvening = hour >= 17;

  if (OPENAI_ENABLED) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Suggest 3 local evening activities as JSON array with title, description, category, reason.",
          },
          {
            role: "user",
            content: `Interests: ${interests.join(", ")}. Time: ${hour}:00. Community: Oak Hills.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });
      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: LifestyleRecommendation[] };
        if (parsed.items?.length) {
          return { items: parsed.items.slice(0, 4), source: "ai" };
        }
      }
    } catch {
      // fall through to rules
    }
  }

  const tags = getRecommendationsForInterests(interests, { hour });
  const items: LifestyleRecommendation[] = [];

  if (tags.includes("dinner") || isEvening) {
    items.push({
      id: "lr1",
      title: "Happy Hour at Corner Table",
      description: "2-for-1 appetizers until 6 PM — patio seating available.",
      category: "dining",
      imageUrl: communityPhotos.businesses.cornerStore,
      href: "/deals",
      reason: "Based on your food interest and the time of day",
    });
  }

  if (tags.includes("tonight-events") || interests.includes("events")) {
    const event = mockEvents.find((e) => new Date(e.startsAt).getDate() === new Date().getDate());
    items.push({
      id: "lr2",
      title: event?.title ?? "Farmers Market Preview",
      description: event?.description ?? "Live music and local vendors at Town Square.",
      category: "events",
      imageUrl: event?.imageUrl ?? communityPhotos.events.farmersMarket,
      href: "/events",
      reason: "Popular event happening near you",
    });
  }

  if (tags.includes("expiring-deals") || interests.includes("deals")) {
    const deal = mockDeals.find((d) => new Date(d.expiresAt).getTime() - Date.now() < 86400000 * 3);
    items.push({
      id: "lr3",
      title: deal?.title ?? "Local deal expiring soon",
      description: deal?.description ?? "Save at a neighborhood business today.",
      category: "deals",
      imageUrl: deal?.imageUrl ?? undefined,
      href: "/deals",
      reason: "Deal expires within 3 days",
    });
  }

  if (interests.includes("family") || tags.includes("family-activities")) {
    items.push({
      id: "lr4",
      title: "Story Time at Library",
      description: "Free reading session for ages 2–8. Starts at 4 PM.",
      category: "family",
      imageUrl: communityPhotos.places.communityCenter,
      href: "/family",
      reason: "Kid-friendly activity matching your family interests",
    });
  }

  if (interests.includes("social") || tags.includes("groups")) {
    const group = mockGroups.find((g) => g.isMember);
    items.push({
      id: "lr5",
      title: group?.name ?? "Join a local group",
      description: group?.description ?? "Connect with neighbors who share your interests.",
      category: "social",
      imageUrl: group?.coverPhoto ?? undefined,
      href: group ? `/groups/${group.id}` : "/groups",
      reason: "Groups you're part of have new activity",
    });
  }

  if (interests.includes("outdoors") || tags.includes("parks")) {
    items.push({
      id: "lr6",
      title: "Sunset Walk at Cedar Park",
      description: "72°F and partly cloudy — perfect for an evening stroll.",
      category: "outdoors",
      imageUrl: communityPhotos.places.park,
      href: "/map",
      reason: "Great weather for outdoor activities",
    });
  }

  return { items: items.slice(0, 4), source: "rules" };
}
