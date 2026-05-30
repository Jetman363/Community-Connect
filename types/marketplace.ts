import type {
  ListingStatus,
  ListingType,
  MarketplaceCategory,
  JobType,
  JobStatus,
  InquiryStatus,
  FavoriteTargetType,
  VerificationType,
  VerificationStatus,
  ReviewModerationStatus,
} from "@prisma/client";

export interface SellerSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface MarketplaceListingDto {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  price: number | null;
  negotiable: boolean;
  type: ListingType;
  category: MarketplaceCategory;
  status: ListingStatus;
  imageUrl: string | null;
  imageGallery: string[];
  videoUrl: string | null;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  featured: boolean;
  promoted: boolean;
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: SellerSummary;
  favorited?: boolean;
}

export interface BusinessDto {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  category: string;
  categories: string[];
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationBadges: string[];
  imageUrl: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  hours: Record<string, unknown> | null;
  socialLinks: Record<string, string> | null;
  serviceAreas: string[];
  pricingRange: string | null;
  certifications: string[];
  distanceM?: number;
  favorited?: boolean;
}

export interface ServiceDto {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  category: string;
  priceFrom: number | null;
  priceTo: number | null;
  availability: string | null;
  serviceRadiusM: number | null;
}

export interface JobListingDto {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  jobType: JobType;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryUnit: string | null;
  skills: string[];
  location: string | null;
  lat: number | null;
  lng: number | null;
  remote: boolean;
  createdAt: string;
  expiresAt: string | null;
  poster: SellerSummary;
  favorited?: boolean;
}

export interface ReviewDto {
  id: string;
  businessId: string;
  rating: number;
  categoryRatings: Record<string, number> | null;
  comment: string | null;
  photos: string[];
  helpfulCount: number;
  verifiedCustomer: boolean;
  ownerResponse: string | null;
  ownerRespondedAt: string | null;
  moderationStatus: ReviewModerationStatus;
  createdAt: string;
  author: SellerSummary;
  userVotedHelpful?: boolean;
}

export interface InquiryDto {
  id: string;
  message: string;
  quoteRequest: boolean;
  status: InquiryStatus;
  businessId: string | null;
  listingId: string | null;
  jobId: string | null;
  createdAt: string;
}

export interface FavoriteDto {
  id: string;
  targetType: FavoriteTargetType;
  targetId: string;
  label: string | null;
  createdAt: string;
}

export interface VerificationRequestDto {
  id: string;
  businessId: string;
  type: VerificationType;
  status: VerificationStatus;
  adminNotes: string | null;
  createdAt: string;
}

export interface BusinessAnalyticsDto {
  businessId: string;
  viewCount: number;
  inquiryCount: number;
  listingViews: number;
  updatedAt: string;
}

export interface SearchRecommendationsDto {
  nearby: MarketplaceListingDto[];
  trending: MarketplaceListingDto[];
  businesses: BusinessDto[];
  jobs: JobListingDto[];
}
