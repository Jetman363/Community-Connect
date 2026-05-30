import { listListings } from "@/lib/api/services/marketplace";
import { listBusinesses } from "@/lib/api/services/businesses";
import { listJobs } from "@/lib/api/services/jobs";
import type { MarketplaceListingDto, BusinessDto, JobListingDto } from "@/types/marketplace";

export interface DiscoverResult {
  listings: MarketplaceListingDto[];
  businesses: BusinessDto[];
  jobs: JobListingDto[];
}

export async function discoverSearch(input: {
  communityId: string;
  q?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radiusM?: number;
  verified?: boolean;
  priceMin?: number;
  priceMax?: number;
  userId?: string;
  limit?: number;
}): Promise<DiscoverResult> {
  const limit = input.limit ?? 12;
  const search = input.q?.trim() || undefined;

  const [listingsRes, businessesRes, jobsRes] = await Promise.all([
    listListings({
      communityId: input.communityId,
      userId: input.userId,
      search,
      lat: input.lat,
      lng: input.lng,
      radiusM: input.radiusM,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      limit,
    }),
    listBusinesses({
      communityId: input.communityId,
      userId: input.userId,
      search,
      verified: input.verified,
      category: input.category,
      lat: input.lat,
      lng: input.lng,
      radiusM: input.radiusM,
      limit,
    }),
    listJobs({
      communityId: input.communityId,
      userId: input.userId,
      search,
      limit,
    }),
  ]);

  return {
    listings: listingsRes.items,
    businesses: businessesRes.items,
    jobs: jobsRes.items,
  };
}
