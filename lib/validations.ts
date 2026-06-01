import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(64),
  role: z
    .enum([
      "RESIDENT",
      "BUSINESS_OWNER",
      "MODERATOR",
      "ADMIN",
      "PUBLIC_SAFETY",
      "HOA_MANAGER",
    ])
    .optional()
    .default("RESIDENT"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const postSchema = z.object({
  content: z.string().min(1).max(5000),
  title: z.string().max(200).optional(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "POLL"]).optional(),
  category: z
    .enum(["GENERAL", "NEIGHBORHOOD", "SAFETY", "EVENTS", "MARKETPLACE", "HOA"])
    .optional(),
  mediaUrls: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  locationLabel: z.string().max(200).optional(),
  pollData: z
    .object({
      question: z.string().min(1).max(300),
      options: z.array(z.string().min(1).max(100)).min(2).max(6),
    })
    .optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  title: z.string().max(200).optional(),
  category: z
    .enum(["GENERAL", "NEIGHBORHOOD", "SAFETY", "EVENTS", "MARKETPLACE", "HOA"])
    .optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const reactionSchema = z.object({
  type: z.enum(["LIKE", "HELPFUL", "SUPPORT", "ALERT_ACK"]).default("LIKE"),
});

export const contentReportSchema = z.object({
  entityType: z.enum(["POST", "COMMENT", "USER", "LISTING"]),
  entityId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
});

export const feedQuerySchema = z.object({
  sort: z.enum(["latest", "trending"]).default("latest"),
  category: z
    .enum(["GENERAL", "NEIGHBORHOOD", "SAFETY", "EVENTS", "MARKETPLACE", "HOA"])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const socialPlatformSchema = z.enum([
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "TWITTER",
  "LINKEDIN",
  "YOUTUBE",
]);

export const connectSocialLinkSchema = z.object({
  platform: socialPlatformSchema,
  profileUrl: z.string().url().max(500),
  username: z.string().min(1).max(64).optional(),
  isPublic: z.boolean().optional(),
});

export const patchSocialLinksSchema = z.object({
  isPublic: z.boolean().optional(),
  platforms: z
    .array(
      z.object({
        platform: socialPlatformSchema,
        isPublic: z.boolean(),
      })
    )
    .optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const reportSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z
    .enum([
      "HAZARD",
      "CRIME",
      "MAINTENANCE",
      "NOISE",
      "TRAFFIC",
      "ENVIRONMENTAL",
      "OTHER",
    ])
    .optional(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
  anonymous: z.boolean().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  locationLabel: z.string().max(300).optional(),
  mediaUrls: z.array(z.string()).optional(),
});

export const updateReportSchema = z.object({
  status: z
    .enum(["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .optional(),
  assignedToId: z.string().optional().nullable(),
  severity: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
  category: z
    .enum([
      "HAZARD",
      "CRIME",
      "MAINTENANCE",
      "NOISE",
      "TRAFFIC",
      "ENVIRONMENTAL",
      "OTHER",
    ])
    .optional(),
});

export const alertSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z
    .enum([
      "CRIME",
      "WEATHER",
      "TRAFFIC",
      "MISSING",
      "HOA",
      "COMMUNITY",
      "FIRE",
      "MEDICAL",
      "OTHER",
    ])
    .optional(),
  severity: z.enum(["INFO", "LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusM: z.number().positive().max(50000).optional(),
  locationLabel: z.string().max(300).optional(),
  source: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  active: z.boolean().optional(),
});

export const updateAlertSchema = alertSchema.partial();

export const alertsQuerySchema = z.object({
  category: z
    .enum([
      "CRIME",
      "WEATHER",
      "TRAFFIC",
      "MISSING",
      "HOA",
      "COMMUNITY",
      "FIRE",
      "MEDICAL",
      "OTHER",
    ])
    .optional(),
  severity: z.enum(["INFO", "LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().positive().max(50000).optional(),
  search: z.string().max(200).optional(),
  history: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const mapMarkersQuerySchema = z.object({
  layer: z.string().optional(),
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().positive().optional(),
});

export const geofenceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["HOA", "EMERGENCY", "WATCH"]).optional(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  radiusM: z.number().positive().max(50000).optional(),
  polygon: z.unknown().optional(),
});

export const watchAreaSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["HOME", "WORK", "CUSTOM"]).optional(),
  centerLat: z.number(),
  centerLng: z.number(),
  radiusM: z.number().positive().max(50000).optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(300).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

export const marketplaceCategoryEnum = z.enum([
  "BUY_SELL",
  "SERVICES",
  "JOBS",
  "GIG",
  "CLASSIFIEDS",
  "HOUSING",
  "OTHER",
]);

export const marketplaceSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().nonnegative().optional(),
  negotiable: z.boolean().optional(),
  type: z.enum(["FOR_SALE", "WANTED", "JOB", "SERVICE"]).optional(),
  category: marketplaceCategoryEnum.optional(),
  imageUrl: z.string().url().optional(),
  imageGallery: z.array(z.string().url()).max(12).optional(),
  videoUrl: z.string().url().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  locationLabel: z.string().max(300).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateMarketplaceSchema = marketplaceSchema.partial().extend({
  status: z
    .enum(["DRAFT", "ACTIVE", "PENDING", "SOLD", "CLOSED", "EXPIRED", "FLAGGED", "REMOVED"])
    .optional(),
});

export const marketplaceQuerySchema = z.object({
  category: marketplaceCategoryEnum.optional(),
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().positive().max(50000).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const businessSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(3000).optional(),
  category: z.string().min(2).max(80),
  categories: z.array(z.string().max(50)).max(10).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  logoUrl: z.string().url().optional(),
  coverPhotoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  hours: z.record(z.string(), z.unknown()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  serviceAreas: z.array(z.string()).max(20).optional(),
  pricingRange: z.string().max(50).optional(),
  certifications: z.array(z.string()).max(15).optional(),
});

export const businessQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  verified: z.coerce.boolean().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusM: z.coerce.number().positive().max(50000).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const jobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "GIG", "VOLUNTEER"]).optional(),
  salaryMin: z.number().nonnegative().optional(),
  salaryMax: z.number().nonnegative().optional(),
  salaryUnit: z.string().max(20).optional(),
  skills: z.array(z.string().max(40)).max(20).optional(),
  location: z.string().max(300).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  remote: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const reviewSchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(3000).optional(),
  categoryRatings: z.record(z.string(), z.number().min(1).max(5)).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
});

export const inquirySchema = z.object({
  message: z.string().min(10).max(2000),
  quoteRequest: z.boolean().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  listingId: z.string().optional(),
  businessId: z.string().optional(),
  jobId: z.string().optional(),
});

export const verificationRequestSchema = z.object({
  type: z.enum(["IDENTITY", "LICENSE", "COMMUNITY", "PUBLIC_SAFETY", "HOA"]),
  documents: z.array(z.string().url()).max(5).optional(),
});

export const favoriteTypeSchema = z.enum(["LISTING", "BUSINESS", "JOB", "SEARCH"]);

export const searchMarketplaceSchema = marketplaceQuerySchema.extend({
  q: z.string().max(200).optional(),
  verified: z.coerce.boolean().optional(),
});

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().max(8000),
    })
  ),
});
