import type { MarketplaceCategory } from "@prisma/client";

const KEYWORDS: Record<MarketplaceCategory, string[]> = {
  BUY_SELL: ["sell", "buy", "trade", "furniture", "electronics", "bike", "car"],
  SERVICES: ["service", "repair", "cleaning", "landscaping", "plumber"],
  JOBS: ["job", "hire", "position", "salary", "full-time", "part-time"],
  GIG: ["gig", "freelance", "task", "hourly", "walker", "babysit"],
  CLASSIFIEDS: ["classified", "announcement", "lost", "found"],
  HOUSING: ["rent", "lease", "apartment", "room", "housing", "sublet"],
  OTHER: [],
};

/** Stub: rule-based category suggestion until Phase 6 AI. */
export function suggestMarketplaceCategory(
  title: string,
  description?: string
): MarketplaceCategory {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  let best: MarketplaceCategory = "OTHER";
  let bestScore = 0;
  for (const [cat, words] of Object.entries(KEYWORDS) as [MarketplaceCategory, string[]][]) {
    if (cat === "OTHER") continue;
    const score = words.filter((w) => text.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return bestScore > 0 ? best : "BUY_SELL";
}
