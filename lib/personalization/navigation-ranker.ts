import { sidebarNav, mobileNav, type NavItem } from "@/config/navigation";

/** Map nav href to interest keywords for ranking */
const NAV_INTEREST_WEIGHTS: Record<string, string[]> = {
  "/marketplace": ["marketplace", "business"],
  "/deals": ["deals", "restaurants"],
  "/events": ["events", "family", "sports"],
  "/family": ["family", "sports"],
  "/groups": ["community", "pets", "sports"],
  "/discover": ["community", "events", "deals"],
  "/alerts": ["safety"],
  "/news": ["news"],
  "/feed": ["community"],
  "/services": ["business", "restaurants"],
  "/map": ["safety", "outdoors"],
  "/dashboard": [],
};

const BEHAVIOR_NAV_MAP: Record<string, string> = {
  marketplace: "/marketplace",
  listing: "/marketplace",
  deal: "/deals",
  event: "/events",
  group: "/groups",
  alert: "/alerts",
  news: "/news",
  post: "/feed",
  business: "/services",
};

interface RankInput {
  interests: string[];
  behaviors?: Array<{ entityType: string; count: number }>;
  menuLocked?: boolean;
  navOrder?: string[] | null;
}

function scoreNavItem(href: string, input: RankInput): number {
  const keywords = NAV_INTEREST_WEIGHTS[href] ?? [];
  let score = 0;
  for (const interest of input.interests) {
    if (keywords.includes(interest)) score += 15;
  }
  for (const b of input.behaviors ?? []) {
    const mapped = BEHAVIOR_NAV_MAP[b.entityType.toLowerCase()];
    if (mapped === href) score += b.count * 5;
  }
  return score;
}

function rankItems(items: NavItem[], input: RankInput): NavItem[] {
  if (input.menuLocked && input.navOrder?.length) {
    const orderMap = new Map(input.navOrder.map((href, i) => [href, i]));
    return [...items].sort((a, b) => {
      const ai = orderMap.get(a.href) ?? 999;
      const bi = orderMap.get(b.href) ?? 999;
      return ai - bi;
    });
  }

  return [...items].sort((a, b) => {
    const scoreDiff = scoreNavItem(b.href, input) - scoreNavItem(a.href, input);
    if (scoreDiff !== 0) return scoreDiff;
    return items.indexOf(a) - items.indexOf(b);
  });
}

export function rankSidebarNav(input: RankInput): NavItem[] {
  return rankItems(sidebarNav, input);
}

export function rankMobileNav(input: RankInput): NavItem[] {
  return rankItems(mobileNav, input);
}

export function getDefaultNavOrder(interests: string[]): string[] {
  const ranked = rankSidebarNav({ interests });
  return ranked.slice(0, 8).map((n) => n.href);
}
