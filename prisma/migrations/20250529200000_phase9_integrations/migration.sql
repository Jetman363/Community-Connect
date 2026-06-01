-- Phase 9: Integrations & enterprise deployment

CREATE TYPE "ConnectorCategory" AS ENUM (
  'PUBLIC_SAFETY',
  'GOVERNMENT',
  'SMART_CITY',
  'BUSINESS',
  'HOA',
  'MAPPING',
  'NOTIFICATION',
  'IDENTITY'
);

CREATE TYPE "SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'PARTIAL');

CREATE TYPE "ConnectorHealthStatus" AS ENUM (
  'HEALTHY',
  'DEGRADED',
  'UNHEALTHY',
  'UNKNOWN'
);

CREATE TYPE "AutomationRunStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'SKIPPED'
);

CREATE TYPE "AutomationTriggerType" AS ENUM (
  'NEW_INCIDENT',
  'NEW_REPORT',
  'NEW_ALERT',
  'VERIFICATION_APPROVED',
  'CUSTOM'
);

CREATE TYPE "CredentialType" AS ENUM (
  'API_KEY',
  'OAUTH',
  'WEBHOOK_SECRET',
  'BASIC'
);

CREATE TABLE "IntegrationConnector" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ConnectorCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "organizationId" TEXT,
    "communityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationConnector_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnector_slug_organizationId_communityId_key"
  ON "IntegrationConnector"("slug", "organizationId", "communityId");
CREATE INDEX "IntegrationConnector_organizationId_enabled_idx"
  ON "IntegrationConnector"("organizationId", "enabled");
CREATE INDEX "IntegrationConnector_communityId_enabled_idx"
  ON "IntegrationConnector"("communityId", "enabled");
CREATE INDEX "IntegrationConnector_category_idx" ON "IntegrationConnector"("category");

ALTER TABLE "IntegrationConnector" ADD CONSTRAINT "IntegrationConnector_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationConnector" ADD CONSTRAINT "IntegrationConnector_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL DEFAULT 'API_KEY',
    "encryptedPayload" TEXT NOT NULL,
    "keyHint" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IntegrationCredential_connectorId_idx" ON "IntegrationCredential"("connectorId");
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "payloadSummary" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IntegrationSyncLog_connectorId_createdAt_idx"
  ON "IntegrationSyncLog"("connectorId", "createdAt" DESC);
CREATE INDEX "IntegrationSyncLog_status_idx" ON "IntegrationSyncLog"("status");
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntegrationWebhook" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secretHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntegrationWebhook_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IntegrationWebhook_connectorId_active_idx"
  ON "IntegrationWebhook"("connectorId", "active");
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "IntegrationEventSubscription" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "handler" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationEventSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegrationEventSubscription_connectorId_eventType_key"
  ON "IntegrationEventSubscription"("connectorId", "eventType");
CREATE INDEX "IntegrationEventSubscription_eventType_active_idx"
  ON "IntegrationEventSubscription"("eventType", "active");
ALTER TABLE "IntegrationEventSubscription" ADD CONSTRAINT "IntegrationEventSubscription_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ConnectorHealthCheck" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "status" "ConnectorHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastCheck" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB,
    "message" TEXT,
    CONSTRAINT "ConnectorHealthCheck_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConnectorHealthCheck_connectorId_lastCheck_idx"
  ON "ConnectorHealthCheck"("connectorId", "lastCheck" DESC);
ALTER TABLE "ConnectorHealthCheck" ADD CONSTRAINT "ConnectorHealthCheck_connectorId_fkey"
  FOREIGN KEY ("connectorId") REFERENCES "IntegrationConnector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkflowAutomation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AutomationTriggerType" NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "communityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkflowAutomation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WorkflowAutomation_organizationId_enabled_idx"
  ON "WorkflowAutomation"("organizationId", "enabled");
CREATE INDEX "WorkflowAutomation_communityId_idx" ON "WorkflowAutomation"("communityId");
ALTER TABLE "WorkflowAutomation" ADD CONSTRAINT "WorkflowAutomation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AutomationRunLog" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "triggerData" JSONB,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationRunLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AutomationRunLog_automationId_createdAt_idx"
  ON "AutomationRunLog"("automationId", "createdAt" DESC);
ALTER TABLE "AutomationRunLog" ADD CONSTRAINT "AutomationRunLog_automationId_fkey"
  FOREIGN KEY ("automationId") REFERENCES "WorkflowAutomation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TenantBranding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "domain" TEXT,
    "featureFlags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantBranding_organizationId_key" ON "TenantBranding"("organizationId");
ALTER TABLE "TenantBranding" ADD CONSTRAINT "TenantBranding_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OnboardingStep_key_key" ON "OnboardingStep"("key");

CREATE TABLE "OrganizationOnboarding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "progress" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationOnboarding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationOnboarding_organizationId_key"
  ON "OrganizationOnboarding"("organizationId");
ALTER TABLE "OrganizationOnboarding" ADD CONSTRAINT "OrganizationOnboarding_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
