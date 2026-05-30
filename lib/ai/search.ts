import "server-only";
import { aiComplete, safeParseJson, type AiSource } from "@/lib/ai/core";
import { discoverSearch } from "@/lib/api/services/discover";
import { mockEvents } from "@/lib/mock-data/events";
import { mockGroups } from "@/lib/mock-data/groups";
import { mockNewsArticles } from "@/lib/mock-data/news";
import { mockAlerts } from "@/lib/mock-data/alerts";

export type UnifiedSearchTab =
  | "all"
  | "marketplace"
  | "events"
  | "businesses"
  | "groups"
  | "news"
  | "alerts";

export interface UnifiedSearchItem {
  id: string;
  type: UnifiedSearchTab extends "all" ? string : UnifiedSearchTab;
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  meta?: string;
}

export interface UnifiedSearchResult {
  query: string;
  parsedIntent?: string;
  tabs: Record<string, UnifiedSearchItem[]>;
  source: AiSource | "db" | "mock";
}

export interface ParsedSearchIntent {
  keywords: string[];
  categories: UnifiedSearchTab[];
  timeRange?: "today" | "week" | "any";
}

export async function parseNaturalLanguageQuery(q: string): Promise<ParsedSearchIntent> {
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return { keywords: [], categories: ["all"] as unknown as UnifiedSearchTab[] };
  }

  const { content, source } = await aiComplete({
    system: `Parse local community search queries. Return JSON: keywords (string[]), categories (subset of marketplace, events, businesses, groups, news, alerts), timeRange (today|week|any).`,
    user: trimmed,
    json: true,
    maxTokens: 200,
  });

  if (source === "openai") {
    const parsed = safeParseJson<ParsedSearchIntent>(content, { keywords: [trimmed], categories: [] });
    if (parsed.keywords?.length) return parsed;
  }

  return ruleParseIntent(trimmed);
}

function ruleParseIntent(q: string): ParsedSearchIntent {
  const lower = q.toLowerCase();
  const categories: UnifiedSearchTab[] = [];
  if (/market|sell|buy|listing|garage|classified/.test(lower)) categories.push("marketplace");
  if (/event|festival|meetup|tonight|weekend/.test(lower)) categories.push("events");
  if (/business|restaurant|shop|service/.test(lower)) categories.push("businesses");
  if (/group|club|neighbor/.test(lower)) categories.push("groups");
  if (/news|article|headline/.test(lower)) categories.push("news");
  if (/alert|safety|emergency|warning/.test(lower)) categories.push("alerts");
  if (categories.length === 0) {
    categories.push("marketplace", "events", "businesses", "groups", "news", "alerts");
  }
  const timeRange = /today|tonight/.test(lower) ? "today" : /week|weekend/.test(lower) ? "week" : "any";
  return { keywords: q.split(/\s+/).filter((w) => w.length > 2), categories, timeRange };
}

export async function unifiedSearch(input: {
  q: string;
  communityId: string;
  userId?: string;
  tab?: UnifiedSearchTab;
}): Promise<UnifiedSearchResult> {
  const intent = await parseNaturalLanguageQuery(input.q);
  const searchQ = intent.keywords.join(" ") || input.q;
  const sourceParts: Array<AiSource | "db" | "mock"> = [];

  let marketplace: UnifiedSearchItem[] = [];
  let businesses: UnifiedSearchItem[] = [];
  let jobs: UnifiedSearchItem[] = [];

  try {
    const discovered = await discoverSearch({
      communityId: input.communityId,
      q: searchQ,
      userId: input.userId,
      limit: 8,
    });
    marketplace = discovered.listings.map((l) => ({
      id: l.id,
      type: "marketplace",
      title: l.title,
      description: l.description?.slice(0, 120) ?? undefined,
      href: "/marketplace",
      imageUrl: l.imageUrl ?? l.imageGallery?.[0],
      meta: l.price != null ? `$${l.price}` : undefined,
    }));
    businesses = discovered.businesses.map((b) => ({
      id: b.id,
      type: "businesses",
      title: b.name,
      description: b.description?.slice(0, 120) ?? undefined,
      href: `/businesses/${b.id}`,
      imageUrl: b.logoUrl ?? undefined,
      meta: b.category,
    }));
    jobs = discovered.jobs.map((j) => ({
      id: j.id,
      type: "marketplace",
      title: j.title,
      description: j.location ?? "Local job",
      href: "/marketplace",
      meta: j.jobType.replace("_", " "),
    }));
    sourceParts.push("db");
  } catch {
    sourceParts.push("mock");
  }

  const needle = searchQ.toLowerCase();
  const match = (text: string) => !needle || text.toLowerCase().includes(needle);

  const events = mockEvents
    .filter((e) => match(`${e.title} ${e.description ?? ""}`))
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      type: "events" as const,
      title: e.title,
      description: e.description ?? undefined,
      href: "/events",
      imageUrl: e.imageUrl,
      meta: new Date(e.startsAt).toLocaleDateString(),
    }));

  const groups = mockGroups
    .filter((g) => match(`${g.name} ${g.description ?? ""}`))
    .slice(0, 6)
    .map((g) => ({
      id: g.id,
      type: "groups" as const,
      title: g.name,
      description: g.description ?? undefined,
      href: `/groups/${g.id}`,
      imageUrl: g.coverPhoto || undefined,
      meta: `${g.memberCount} members`,
    }));

  const news = mockNewsArticles
    .filter((n) => match(`${n.title} ${n.summary ?? ""}`))
    .slice(0, 6)
    .map((n) => ({
      id: n.id,
      type: "news" as const,
      title: n.title,
      description: n.summary ?? undefined,
      href: "/news",
      imageUrl: n.imageUrl ?? undefined,
      meta: n.source,
    }));

  const alerts = mockAlerts
    .filter((a) => match(`${a.title} ${a.description ?? ""}`))
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      type: "alerts" as const,
      title: a.title,
      description: a.description,
      href: "/alerts",
      meta: a.severity,
    }));

  const tabs: Record<string, UnifiedSearchItem[]> = {
    marketplace: [...marketplace, ...jobs],
    events,
    businesses,
    groups,
    news,
    alerts,
    all: [...marketplace, ...businesses, ...events, ...groups, ...news, ...alerts],
  };

  const tab = input.tab ?? "all";
  if (tab !== "all" && tabs[tab]) {
    tabs.all = tabs[tab];
  }

  const source = sourceParts.includes("db") ? "db" : sourceParts[0] ?? "mock";

  return {
    query: input.q,
    parsedIntent: intent.categories.join(", ") || undefined,
    tabs,
    source,
  };
}
