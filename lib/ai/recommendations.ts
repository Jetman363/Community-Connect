import type { SearchRecommendationsDto } from "@/types/marketplace";
import {
  getFeaturedListings,
  getTrendingListings,
  bboxListings,
} from "@/lib/api/services/marketplace";
import { listBusinesses } from "@/lib/api/services/businesses";
import { listJobs } from "@/lib/api/services/jobs";

export interface RecommendationInput {
  communityId: string;
  userId?: string;
  lat?: number;
  lng?: number;
  radiusM?: number;
}

/** Rule-based recommendations; Phase 6 will add ML ranking. */
export async function getRecommendations(
  input: RecommendationInput
): Promise<SearchRecommendationsDto> {
  const radiusM = input.radiusM ?? 5000;

  const [featured, trending, businessesRes, jobsRes] = await Promise.all([
    getFeaturedListings(input.communityId, 6),
    getTrendingListings(input.communityId, 8),
    listBusinesses({
      communityId: input.communityId,
      userId: input.userId,
      verified: true,
      lat: input.lat,
      lng: input.lng,
      radiusM: input.lat != null ? radiusM : undefined,
      limit: 6,
    }),
    listJobs({ communityId: input.communityId, userId: input.userId, limit: 4 }),
  ]);

  let nearby = featured.items;
  if (input.lat != null && input.lng != null) {
    nearby = await bboxListings(input.communityId, input.lat, input.lng, radiusM);
    if (nearby.length === 0) nearby = featured.items;
  }

  return {
    nearby: nearby.slice(0, 6),
    trending: trending,
    businesses: businessesRes.items,
    jobs: jobsRes.items,
  };
}

/** Placeholder for Phase 6 personalized ranking. */
export function rankRecommendations<T extends { viewCount?: number; featured?: boolean }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = (a.featured ? 100 : 0) + (a.viewCount ?? 0);
    const scoreB = (b.featured ? 100 : 0) + (b.viewCount ?? 0);
    return scoreB - scoreA;
  });
}
