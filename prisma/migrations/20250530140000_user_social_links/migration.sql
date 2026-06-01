-- User social profile links (Phase 10)

CREATE TYPE "SocialPlatform" AS ENUM (
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
  'TWITTER',
  'LINKEDIN',
  'YOUTUBE'
);

CREATE TABLE "UserSocialLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "profileUrl" TEXT NOT NULL,
  "username" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSocialLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSocialLink_userId_platform_key" ON "UserSocialLink"("userId", "platform");
CREATE INDEX "UserSocialLink_userId_idx" ON "UserSocialLink"("userId");

ALTER TABLE "UserSocialLink" ADD CONSTRAINT "UserSocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
