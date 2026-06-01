import {
  mockListings,
  mockSellers,
  mockMarketplaceRecommendations,
} from "@/lib/mock-data/marketplace";
import { mockBusinesses } from "@/lib/mock-data/businesses";
import { businessCoverPhoto } from "@/lib/images/community-photos";
import type {
  MarketplaceListingDto,
  BusinessDto,
  JobListingDto,
} from "@/types/marketplace";

const TYPE_MAP: Record<string, MarketplaceListingDto["type"]> = {
  sell: "FOR_SALE",
  buy: "WANTED",
  job: "JOB",
  trade: "FOR_SALE",
  free: "FOR_SALE",
};

const CAT_MAP: Record<string, MarketplaceListingDto["category"]> = {
  sell: "BUY_SELL",
  buy: "BUY_SELL",
  job: "JOBS",
  trade: "BUY_SELL",
  free: "CLASSIFIEDS",
};

function sellerFor(id: string) {
  const s = mockSellers[id];
  return {
    id,
    displayName: s?.displayName ?? "Neighbor",
    verified: s?.verified ?? false,
    reputationScore: s?.reputationScore ?? 4.0,
    totalSales: s?.totalSales ?? 0,
    memberSince: s?.memberSince,
  };
}

export function getMockMarketplaceListings(): MarketplaceListingDto[] {
  return mockListings.map((l) => ({
    id: l.id,
    communityId: "mock-community",
    title: l.title,
    description: l.description,
    price: l.price,
    negotiable: l.type === "sell" && l.price != null && l.price > 0,
    type: TYPE_MAP[l.type] ?? "FOR_SALE",
    category: CAT_MAP[l.type] ?? "BUY_SELL",
    status: "ACTIVE",
    imageUrl: l.imageUrl ?? null,
    imageGallery: l.imageGallery ?? (l.imageUrl ? [l.imageUrl] : []),
    videoUrl: null,
    lat: null,
    lng: null,
    locationLabel: l.location,
    featured: l.id === "m1" || l.id === "m6" || l.id === "m13",
    promoted: l.id === "m6" || l.id === "m7",
    viewCount: l.views,
    expiresAt: null,
    createdAt: l.createdAt,
    updatedAt: l.createdAt,
    seller: sellerFor(l.sellerId),
    favorited: l.saved,
    condition: l.condition ?? null,
    classifiedType: l.classifiedType ?? null,
    subCategory: l.category,
  }));
}

export function getMockFeaturedListings(): MarketplaceListingDto[] {
  return getMockMarketplaceListings().filter((l) => l.featured || l.promoted);
}

export function getMockRecentListings(): MarketplaceListingDto[] {
  return [...getMockMarketplaceListings()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getMockNearbyListings(): MarketplaceListingDto[] {
  const nearbyIds = new Set(mockListings.filter((l) => l.nearby).map((l) => l.id));
  return getMockMarketplaceListings().filter((l) => nearbyIds.has(l.id));
}

export function getMockTrendingListings(): MarketplaceListingDto[] {
  const trendingIds = new Set(mockListings.filter((l) => l.trending).map((l) => l.id));
  return getMockMarketplaceListings().filter((l) => trendingIds.has(l.id));
}

export function getMockClassifiedListings(): MarketplaceListingDto[] {
  return getMockMarketplaceListings().filter((l) => l.classifiedType != null);
}

export function getMockGiveawayListings(): MarketplaceListingDto[] {
  return getMockMarketplaceListings().filter((l) => l.classifiedType === "giveaway");
}

export function getMockWantedListings(): MarketplaceListingDto[] {
  return getMockMarketplaceListings().filter(
    (l) => l.classifiedType === "wanted" || l.type === "WANTED"
  );
}

export function getMockMarketplaceRecommendations() {
  return mockMarketplaceRecommendations;
}

export function getMockBusinessesDto(): BusinessDto[] {
  return mockBusinesses.map((b) => ({
    id: b.id,
    communityId: "mock-community",
    name: b.name,
    description: b.description,
    category: b.category,
    categories: b.tags,
    address: b.address,
    phone: b.phone,
    website: null,
    lat: 37.774,
    lng: -122.42,
    rating: b.rating,
    reviewCount: b.reviewCount,
    verified: b.verified,
    verificationBadges: b.verified ? ["community"] : [],
    imageUrl: b.imageUrl ?? null,
    logoUrl: b.imageUrl ?? null,
    coverPhotoUrl: b.imageUrl ?? businessCoverPhoto(b.category),
    hours: { summary: b.hours },
    socialLinks: null,
    serviceAreas: [],
    pricingRange: null,
    certifications: [],
  }));
}

export function getMockJobs(): JobListingDto[] {
  const jobListings = mockListings.filter((l) => l.type === "job");
  const extraJobs: JobListingDto[] = [
    {
      id: "job-mock-1",
      communityId: "mock-community",
      title: jobListings[0]?.title ?? "Part-Time Dog Walker Needed",
      description: jobListings[0]?.description ?? "Mon/Wed/Fri mornings.",
      jobType: "PART_TIME",
      status: "ACTIVE",
      salaryMin: 20,
      salaryMax: 25,
      salaryUnit: "hour",
      skills: ["dogs", "reliable"],
      location: jobListings[0]?.location ?? "Oak Hills",
      lat: null,
      lng: null,
      remote: false,
      createdAt: jobListings[0]?.createdAt ?? new Date().toISOString(),
      expiresAt: null,
      poster: sellerFor("u2"),
    },
    {
      id: "job-mock-2",
      communityId: "mock-community",
      title: "Full-Time Office Manager",
      description: "Local HOA management company seeking organized office manager.",
      jobType: "FULL_TIME",
      status: "ACTIVE",
      salaryMin: 45000,
      salaryMax: 55000,
      salaryUnit: "year",
      skills: ["admin", "communication"],
      location: "Oak Hills",
      lat: null,
      lng: null,
      remote: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      expiresAt: null,
      poster: sellerFor("u4"),
    },
    {
      id: "job-mock-3",
      communityId: "mock-community",
      title: "Weekend Farmers Market Gig",
      description: "Help set up and break down vendor booths. Cash daily.",
      jobType: "GIG",
      status: "ACTIVE",
      salaryMin: 18,
      salaryMax: 22,
      salaryUnit: "hour",
      skills: [],
      location: "Town Square",
      lat: null,
      lng: null,
      remote: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: null,
      poster: sellerFor("demo-resident"),
    },
    {
      id: "job-mock-4",
      communityId: "mock-community",
      title: "Volunteer: Community Garden Coordinator",
      description: "Lead weekly garden sessions. No experience required.",
      jobType: "VOLUNTEER",
      status: "ACTIVE",
      salaryMin: null,
      salaryMax: null,
      salaryUnit: null,
      skills: ["gardening"],
      location: "Cedar Park Garden",
      lat: null,
      lng: null,
      remote: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: null,
      poster: sellerFor("u3"),
    },
  ];
  return extraJobs;
}
