-- Phase 5: Marketplace, businesses, jobs, reviews, inquiries

-- CreateEnum
CREATE TYPE "MarketplaceCategory" AS ENUM ('BUY_SELL', 'SERVICES', 'JOBS', 'GIG', 'CLASSIFIEDS', 'HOUSING', 'OTHER');
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'GIG', 'VOLUNTEER');
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'FILLED', 'CLOSED', 'EXPIRED', 'FLAGGED');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'CLOSED', 'SPAM');
CREATE TYPE "FavoriteTargetType" AS ENUM ('LISTING', 'BUSINESS', 'JOB', 'SEARCH');
CREATE TYPE "VerificationType" AS ENUM ('IDENTITY', 'LICENSE', 'COMMUNITY', 'PUBLIC_SAFETY', 'HOA');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'REMOVED');
CREATE TYPE "PromotionTargetType" AS ENUM ('LISTING', 'BUSINESS');

-- AlterEnum MapLayerType
ALTER TYPE "MapLayerType" ADD VALUE IF NOT EXISTS 'MARKETPLACE';
ALTER TYPE "MapLayerType" ADD VALUE IF NOT EXISTS 'JOBS';

-- AlterEnum ListingStatus
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'FLAGGED';

-- Business extensions
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "verificationBadges" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "coverPhotoUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "hours" JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "pricingRange" TEXT;
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- MarketplaceListing extensions
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "category" "MarketplaceCategory" NOT NULL DEFAULT 'BUY_SELL';
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "negotiable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "imageGallery" JSONB;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "locationLabel" TEXT;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "promoted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MarketplaceListing" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Review extensions
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "categoryRatings" JSONB;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "verifiedCustomer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "ownerResponse" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "ownerRespondedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'APPROVED';

-- New tables
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priceFrom" DOUBLE PRECISION,
    "priceTo" DOUBLE PRECISION,
    "availability" TEXT,
    "serviceRadiusM" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "salaryUnit" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "listingId" TEXT,
    "jobId" TEXT,
    "message" TEXT NOT NULL,
    "quoteRequest" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "FavoriteTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adminNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "targetType" "PromotionTargetType" NOT NULL,
    "listingId" TEXT,
    "businessId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessAnalytics" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "listingViews" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewHelpfulVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewHelpfulVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Service" ADD CONSTRAINT "Service_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessAnalytics" ADD CONSTRAINT "BusinessAnalytics_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "Favorite_userId_targetType_targetId_key" ON "Favorite"("userId", "targetType", "targetId");
CREATE INDEX "Favorite_userId_targetType_idx" ON "Favorite"("userId", "targetType");
CREATE UNIQUE INDEX "BusinessAnalytics_businessId_key" ON "BusinessAnalytics"("businessId");
CREATE UNIQUE INDEX "ReviewHelpfulVote_reviewId_userId_key" ON "ReviewHelpfulVote"("reviewId", "userId");
CREATE UNIQUE INDEX "ReviewReport_reviewId_userId_key" ON "ReviewReport"("reviewId", "userId");
CREATE INDEX "JobListing_communityId_status_createdAt_idx" ON "JobListing"("communityId", "status", "createdAt" DESC);
CREATE INDEX "Inquiry_businessId_status_idx" ON "Inquiry"("businessId", "status");
CREATE INDEX "VerificationRequest_status_createdAt_idx" ON "VerificationRequest"("status", "createdAt" DESC);
