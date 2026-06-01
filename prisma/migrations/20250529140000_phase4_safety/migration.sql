-- Phase 4: Safety, maps, geofencing

-- Alert severity enum migration
CREATE TYPE "AlertCategory" AS ENUM ('CRIME', 'WEATHER', 'TRAFFIC', 'MISSING', 'HOA', 'COMMUNITY', 'FIRE', 'MEDICAL', 'OTHER');
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE "IncidentCategory" AS ENUM ('HAZARD', 'CRIME', 'MAINTENANCE', 'NOISE', 'TRAFFIC', 'ENVIRONMENTAL', 'OTHER');
CREATE TYPE "GeofenceType" AS ENUM ('HOA', 'EMERGENCY', 'WATCH');
CREATE TYPE "MapLayerType" AS ENUM ('ALERTS', 'REPORTS', 'EVENTS', 'BUSINESSES', 'HEATMAP');
CREATE TYPE "WatchAreaType" AS ENUM ('HOME', 'WORK', 'CUSTOM');

ALTER TYPE "AlertSeverity" RENAME TO "AlertSeverity_old";
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL');

ALTER TABLE "SafetyAlert" ADD COLUMN IF NOT EXISTS "category" "AlertCategory" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "SafetyAlert" ADD COLUMN IF NOT EXISTS "radiusM" DOUBLE PRECISION;
ALTER TABLE "SafetyAlert" ADD COLUMN IF NOT EXISTS "locationLabel" TEXT;
ALTER TABLE "SafetyAlert" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "SafetyAlert" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SafetyAlert" ALTER COLUMN "severity" DROP DEFAULT;
ALTER TABLE "SafetyAlert" ALTER COLUMN "severity" TYPE "AlertSeverity" USING (
  CASE "severity"::text
    WHEN 'ADVISORY' THEN 'LOW'::"AlertSeverity"
    WHEN 'WARNING' THEN 'MODERATE'::"AlertSeverity"
    WHEN 'EMERGENCY' THEN 'CRITICAL'::"AlertSeverity"
    ELSE 'INFO'::"AlertSeverity"
  END
);
ALTER TABLE "SafetyAlert" ALTER COLUMN "severity" SET DEFAULT 'INFO';
DROP TYPE "AlertSeverity_old";

ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "severity" "ReportSeverity" NOT NULL DEFAULT 'MODERATE';
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "anonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "locationLabel" TEXT;
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "suggestedCategory" "IncidentCategory";

UPDATE "Report" SET "category" = 'OTHER' WHERE "category" IS NULL OR "category" NOT IN (
  'HAZARD','CRIME','MAINTENANCE','NOISE','TRAFFIC','ENVIRONMENTAL','OTHER'
);

ALTER TABLE "Report" DROP COLUMN IF EXISTS "aiCategory";
ALTER TABLE "Report" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Report" ALTER COLUMN "category" TYPE "IncidentCategory" USING (
  CASE LOWER(COALESCE("category"::text, 'other'))
    WHEN 'hazard' THEN 'HAZARD'::"IncidentCategory"
    WHEN 'crime' THEN 'CRIME'::"IncidentCategory"
    WHEN 'maintenance' THEN 'MAINTENANCE'::"IncidentCategory"
    WHEN 'noise' THEN 'NOISE'::"IncidentCategory"
    WHEN 'traffic' THEN 'TRAFFIC'::"IncidentCategory"
    ELSE 'OTHER'::"IncidentCategory"
  END
);
ALTER TABLE "Report" ALTER COLUMN "category" SET DEFAULT 'OTHER';

CREATE TABLE "GeofenceZone" (
  "id" TEXT NOT NULL,
  "communityId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "GeofenceType" NOT NULL DEFAULT 'WATCH',
  "centerLat" DOUBLE PRECISION,
  "centerLng" DOUBLE PRECISION,
  "radiusM" DOUBLE PRECISION,
  "polygon" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GeofenceZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "zoneId" TEXT,
  "centerLat" DOUBLE PRECISION,
  "centerLng" DOUBLE PRECISION,
  "radiusM" DOUBLE PRECISION DEFAULT 1609,
  "notifyEmergency" BOOLEAN NOT NULL DEFAULT true,
  "notifyModerate" BOOLEAN NOT NULL DEFAULT true,
  "notifyInfo" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertAcknowledgment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertAcknowledgment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlertBookmark" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WatchArea" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "WatchAreaType" NOT NULL DEFAULT 'CUSTOM',
  "centerLat" DOUBLE PRECISION NOT NULL,
  "centerLng" DOUBLE PRECISION NOT NULL,
  "radiusM" DOUBLE PRECISION NOT NULL DEFAULT 804,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WatchArea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocationHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MapLayerPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "layers" "MapLayerType"[] DEFAULT ARRAY['ALERTS','EVENTS','BUSINESSES']::"MapLayerType"[],
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MapLayerPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AlertSubscription_userId_zoneId_key" ON "AlertSubscription"("userId", "zoneId");
CREATE UNIQUE INDEX "AlertAcknowledgment_userId_alertId_key" ON "AlertAcknowledgment"("userId", "alertId");
CREATE UNIQUE INDEX "AlertBookmark_userId_alertId_key" ON "AlertBookmark"("userId", "alertId");
CREATE UNIQUE INDEX "MapLayerPreference_userId_key" ON "MapLayerPreference"("userId");

CREATE INDEX "SafetyAlert_communityId_category_createdAt_idx" ON "SafetyAlert"("communityId", "category", "createdAt" DESC);
CREATE INDEX "SafetyAlert_lat_lng_idx" ON "SafetyAlert"("lat", "lng");
CREATE INDEX "SafetyAlert_expiresAt_idx" ON "SafetyAlert"("expiresAt");
CREATE INDEX "Report_communityId_category_idx" ON "Report"("communityId", "category");
CREATE INDEX "Report_lat_lng_idx" ON "Report"("lat", "lng");
CREATE INDEX "Report_assignedToId_idx" ON "Report"("assignedToId");
CREATE INDEX "GeofenceZone_communityId_active_idx" ON "GeofenceZone"("communityId", "active");
CREATE INDEX "GeofenceZone_centerLat_centerLng_idx" ON "GeofenceZone"("centerLat", "centerLng");
CREATE INDEX "AlertSubscription_userId_idx" ON "AlertSubscription"("userId");
CREATE INDEX "AlertAcknowledgment_alertId_idx" ON "AlertAcknowledgment"("alertId");
CREATE INDEX "AlertBookmark_userId_createdAt_idx" ON "AlertBookmark"("userId", "createdAt" DESC);
CREATE INDEX "WatchArea_userId_idx" ON "WatchArea"("userId");
CREATE INDEX "LocationHistory_userId_recordedAt_idx" ON "LocationHistory"("userId", "recordedAt" DESC);

ALTER TABLE "SafetyAlert" ADD CONSTRAINT "SafetyAlert_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeofenceZone" ADD CONSTRAINT "GeofenceZone_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertSubscription" ADD CONSTRAINT "AlertSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertSubscription" ADD CONSTRAINT "AlertSubscription_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "GeofenceZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertAcknowledgment" ADD CONSTRAINT "AlertAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertAcknowledgment" ADD CONSTRAINT "AlertAcknowledgment_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SafetyAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertBookmark" ADD CONSTRAINT "AlertBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlertBookmark" ADD CONSTRAINT "AlertBookmark_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SafetyAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchArea" ADD CONSTRAINT "WatchArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MapLayerPreference" ADD CONSTRAINT "MapLayerPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
