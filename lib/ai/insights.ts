import "server-only";
import { aiComplete, safeParseJson, type AiSource } from "@/lib/ai/core";
import { mockTrendingItems } from "@/lib/mock-data/discover";
import { mockAlerts } from "@/lib/mock-data/alerts";

export interface CommunityInsight {
  id: string;
  title: string;
  summary: string;
  sentiment: "positive" | "neutral" | "concerned";
  category: "engagement" | "safety" | "marketplace" | "events";
}

export interface CommunityInsightsResult {
  headline: string;
  insights: CommunityInsight[];
  trendingTopics: string[];
  source: AiSource;
  generatedAt: string;
}

export async function getCommunityInsights(input: {
  communityName?: string;
  interests?: string[];
}): Promise<CommunityInsightsResult> {
  const community = input.communityName ?? "Oak Hills";
  const trending = mockTrendingItems.slice(0, 5).map((t) => t.title);
  const activeAlerts = mockAlerts.filter((a) => a.active).length;

  const { content, source } = await aiComplete({
    system: `Summarize local community pulse for admins/residents. JSON: headline (string), insights (array of {id, title, summary, sentiment, category}), trendingTopics (string[]).`,
    user: `Community: ${community}. Interests: ${(input.interests ?? []).join(", ")}. Trending: ${trending.join("; ")}. Active alerts: ${activeAlerts}.`,
    json: true,
    maxTokens: 700,
  });

  const parsed = safeParseJson<{
    headline?: string;
    insights?: CommunityInsight[];
    trendingTopics?: string[];
  }>(content, {});

  if (parsed.insights?.length) {
    return {
      headline: parsed.headline ?? `${community} community pulse`,
      insights: parsed.insights.slice(0, 6),
      trendingTopics: parsed.trendingTopics ?? trending,
      source,
      generatedAt: new Date().toISOString(),
    };
  }

  return mockInsights(community, trending, activeAlerts, source);
}

function mockInsights(
  community: string,
  trending: string[],
  activeAlerts: number,
  source: AiSource
): CommunityInsightsResult {
  const insights: CommunityInsight[] = [
    {
      id: "ins-1",
      title: "Engagement up this week",
      summary: "Community posts and marketplace views rose ~12% vs last week.",
      sentiment: "positive",
      category: "engagement",
    },
    {
      id: "ins-2",
      title: "Marketplace activity",
      summary: "Garage sales and tools listings are trending in Oak Hills.",
      sentiment: "positive",
      category: "marketplace",
    },
    {
      id: "ins-3",
      title: "Weekend events",
      summary: "Farmers market and library story time drive family traffic.",
      sentiment: "positive",
      category: "events",
    },
  ];

  if (activeAlerts > 0) {
    insights.push({
      id: "ins-4",
      title: "Safety awareness",
      summary: `${activeAlerts} active alert(s) — residents checking in regularly.`,
      sentiment: "concerned",
      category: "safety",
    });
  }

  return {
    headline: `${community}: neighbors staying connected`,
    insights,
    trendingTopics: trending,
    source,
    generatedAt: new Date().toISOString(),
  };
}
