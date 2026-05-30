import { mockListings } from "@/lib/mock-data/marketplace";
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

export function getMockMarketplaceListings(): MarketplaceListingDto[] {
  return mockListings.map((l) => ({
    id: l.id,
    communityId: "mock-community",
    title: l.title,
    description: l.description,
    price: l.price,
    negotiable: false,
    type: TYPE_MAP[l.type] ?? "FOR_SALE",
    category: CAT_MAP[l.type] ?? "BUY_SELL",
    status: "ACTIVE",
    imageUrl: l.imageUrl ?? null,
    imageGallery: l.imageUrl ? [l.imageUrl] : [],
    videoUrl: null,
    lat: null,
    lng: null,
    locationLabel: l.location,
    featured: l.id === "m1" || l.id === "m6",
    promoted: l.id === "m6",
    viewCount: l.views,
    expiresAt: null,
    createdAt: l.createdAt,
    updatedAt: l.createdAt,
    seller: {
      id: l.sellerId,
      displayName: l.sellerId === "demo-resident" ? "Alex Resident" : "Neighbor",
    },
    favorited: l.saved,
  }));
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
  const jobListing = mockListings.find((l) => l.type === "job");
  if (!jobListing) return [];
  return [
    {
      id: "job-mock-1",
      communityId: "mock-community",
      title: jobListing.title,
      description: jobListing.description,
      jobType: "PART_TIME",
      status: "ACTIVE",
      salaryMin: jobListing.price ?? 20,
      salaryMax: (jobListing.price ?? 20) * 1.5,
      salaryUnit: "hour",
      skills: ["dogs", "reliable"],
      location: jobListing.location,
      lat: null,
      lng: null,
      remote: false,
      createdAt: jobListing.createdAt,
      expiresAt: null,
      poster: { id: jobListing.sellerId, displayName: "Sarah Martinez" },
    },
  ];
}
