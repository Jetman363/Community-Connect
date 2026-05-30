import type { FeedPost } from "@/types/feed";

export interface FeedRankingContext {
  userId?: string;
  interests?: string[];
  sort?: "latest" | "trending";
}

interface ScoredPost {
  post: FeedPost;
  score: number;
  reason?: string;
}

const INTEREST_CATEGORY_MAP: Record<string, string[]> = {
  safety: ["SAFETY"],
  events: ["EVENTS"],
  marketplace: ["MARKETPLACE"],
  family: ["GENERAL", "NEIGHBORHOOD"],
  food: ["GENERAL"],
  business: ["MARKETPLACE"],
  community: ["GENERAL", "NEIGHBORHOOD"],
  pets: ["NEIGHBORHOOD"],
  schools: ["GENERAL"],
};

/** AI/rule hybrid ranking — boosts relevance without hiding recent content. */
export function rankFeedPosts(posts: FeedPost[], context: FeedRankingContext = {}): FeedPost[] {
  const interests = context.interests ?? [];
  const preferredCategories = new Set(
    interests.flatMap((i) => INTEREST_CATEGORY_MAP[i.toLowerCase()] ?? [])
  );

  const now = Date.now();
  const scored: ScoredPost[] = posts.map((post) => {
    let score = 0;
    const ageHours = (now - new Date(post.createdAt).getTime()) / 3_600_000;
    const recencyBoost = Math.max(0, 48 - ageHours) * 2;
    score += recencyBoost;

    if (post.category && preferredCategories.has(post.category)) {
      score += 25;
    }

    score += (post.likes ?? 0) * 0.5;
    score += (post.comments ?? 0) * 0.8;
    score += (post.shareCount ?? 0) * 1.2;

    if (context.sort === "trending") {
      score += (post.likes ?? 0) * 2;
    }

    if (post.author?.verified) score += 5;

    let reason: string | undefined;
    if (preferredCategories.has(post.category ?? "") && interests.length > 0) {
      reason = `Matches your ${interests[0]} interest`;
    } else if (ageHours < 6) {
      reason = "Fresh in your feed";
    }

    return { post, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s, i) => {
    const p = { ...s.post };
    if (s.reason && i < 3) {
      (p as FeedPost & { rankingReason?: string }).rankingReason = s.reason;
    }
    return p;
  });
}

export function sectionHeaderForInterest(interest: string): string {
  const map: Record<string, string> = {
    events: "Because you like events",
    marketplace: "Because you browse marketplace",
    deals: "Deals picked for you",
    family: "Family-friendly picks",
    food: "Food & dining near you",
    safety: "Safety updates for you",
    social: "From your groups & neighbors",
  };
  return map[interest] ?? "Picked for you";
}
