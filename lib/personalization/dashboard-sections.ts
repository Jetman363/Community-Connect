export type DashboardSectionId =
  | "welcome"
  | "checkin"
  | "alerts"
  | "marketplace"
  | "forYou"
  | "events"
  | "deals"
  | "trending"
  | "recommendations"
  | "activity"
  | "news"
  | "family"
  | "businesses"
  | "ai"
  | "feed";

const BASE_ORDER: DashboardSectionId[] = [
  "welcome",
  "checkin",
  "alerts",
  "forYou",
  "marketplace",
  "events",
  "deals",
  "trending",
  "recommendations",
  "feed",
  "activity",
  "news",
  "family",
  "businesses",
  "ai",
];

const INTEREST_PRIORITY: Record<string, DashboardSectionId[]> = {
  family: ["family", "events", "forYou"],
  safety: ["alerts", "forYou"],
  marketplace: ["marketplace", "deals", "forYou"],
  business: ["marketplace", "businesses", "deals"],
  deals: ["deals", "marketplace"],
  events: ["events", "recommendations"],
  sports: ["events", "family", "forYou"],
  restaurants: ["deals", "recommendations", "businesses"],
  news: ["news", "trending"],
  community: ["feed", "activity", "trending"],
  pets: ["feed", "activity"],
};

export function rankDashboardSections(interests: string[]): DashboardSectionId[] {
  const boost = new Map<DashboardSectionId, number>();
  for (const id of BASE_ORDER) boost.set(id, BASE_ORDER.length - BASE_ORDER.indexOf(id));

  for (const interest of interests) {
    const priorities = INTEREST_PRIORITY[interest] ?? [];
    priorities.forEach((section, i) => {
      boost.set(section, (boost.get(section) ?? 0) + (priorities.length - i) * 20);
    });
  }

  return [...BASE_ORDER].sort((a, b) => (boost.get(b) ?? 0) - (boost.get(a) ?? 0));
}
