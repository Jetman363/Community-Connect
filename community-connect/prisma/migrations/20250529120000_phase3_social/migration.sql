-- Phase 3: Social feed, reactions, follows, moderation

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'POLL');
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'HELPFUL', 'SUPPORT', 'ALERT_ACK');
CREATE TYPE "FollowTargetType" AS ENUM ('USER', 'BUSINESS', 'COMMUNITY', 'TOPIC');
CREATE TYPE "ContentReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ContentEntityType" AS ENUM ('POST', 'COMMENT', 'USER', 'LISTING');

-- Extend NotificationType
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LIKE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REPLY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FOLLOW';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MARKETPLACE';

-- Drop Like table (replaced by Reaction)
DROP TABLE IF EXISTS "Like";

-- Alter Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "type" "PostType" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "locationLabel" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "pollData" JSONB;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "repostOfId" TEXT;

CREATE INDEX IF NOT EXISTS "Post_communityId_category_createdAt_idx" ON "Post"("communityId", "category", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_repostOfId_idx" ON "Post"("repostOfId");

ALTER TABLE "Post" ADD CONSTRAINT "Post_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Alter Comment
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Reaction
CREATE TABLE IF NOT EXISTS "Reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Reaction_postId_userId_type_key" ON "Reaction"("postId", "userId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "Reaction_commentId_userId_type_key" ON "Reaction"("commentId", "userId", "type");
CREATE INDEX IF NOT EXISTS "Reaction_postId_type_idx" ON "Reaction"("postId", "type");
CREATE INDEX IF NOT EXISTS "Reaction_commentId_type_idx" ON "Reaction"("commentId", "type");
CREATE INDEX IF NOT EXISTS "Reaction_userId_idx" ON "Reaction"("userId");

ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Follow
CREATE TABLE IF NOT EXISTS "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "targetType" "FollowTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Follow_followerId_targetType_targetId_key" ON "Follow"("followerId", "targetType", "targetId");
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx" ON "Follow"("followerId");
CREATE INDEX IF NOT EXISTS "Follow_targetType_targetId_idx" ON "Follow"("targetType", "targetId");

ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable SavedPost
CREATE TABLE IF NOT EXISTS "SavedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedPost_userId_postId_key" ON "SavedPost"("userId", "postId");
CREATE INDEX IF NOT EXISTS "SavedPost_userId_createdAt_idx" ON "SavedPost"("userId", "createdAt" DESC);

ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ContentReport
CREATE TABLE IF NOT EXISTS "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "entityType" "ContentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ContentReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ContentReport_entityType_entityId_idx" ON "ContentReport"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ContentReport_reporterId_idx" ON "ContentReport"("reporterId");

ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable UserBlock
CREATE TABLE IF NOT EXISTS "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");
CREATE INDEX IF NOT EXISTS "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable UserMute
CREATE TABLE IF NOT EXISTS "UserMute" (
    "id" TEXT NOT NULL,
    "muterId" TEXT NOT NULL,
    "mutedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserMute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserMute_muterId_mutedId_key" ON "UserMute"("muterId", "mutedId");
CREATE INDEX IF NOT EXISTS "UserMute_muterId_idx" ON "UserMute"("muterId");

ALTER TABLE "UserMute" ADD CONSTRAINT "UserMute_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMute" ADD CONSTRAINT "UserMute_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter MediaUpload
ALTER TABLE "MediaUpload" ADD COLUMN IF NOT EXISTS "postId" TEXT;
CREATE INDEX IF NOT EXISTS "MediaUpload_postId_idx" ON "MediaUpload"("postId");
ALTER TABLE "MediaUpload" ADD CONSTRAINT "MediaUpload_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
