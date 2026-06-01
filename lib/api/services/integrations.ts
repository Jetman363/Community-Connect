import { prisma } from "@/lib/prisma";
import type { SyncDirection, SyncStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import type { TenantScope } from "@/lib/integrations/types";
import { tenantWhere } from "@/lib/integrations/tenant-scope";
import {
  createConnectorInstance,
  getConnectorDefinition,
  listConnectorsForTenant,
} from "@/lib/integrations/registry";

export async function logSync(
  connectorId: string,
  direction: SyncDirection,
  status: SyncStatus,
  summary?: string,
  error?: string
) {
  return prisma.integrationSyncLog.create({
    data: { connectorId, direction, status, payloadSummary: summary, error },
  });
}

export async function recordHealthCheck(
  connectorId: string,
  status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN",
  message?: string,
  metrics?: Record<string, unknown>
) {
  return prisma.connectorHealthCheck.create({
    data: { connectorId, status, message, metrics: metrics ?? undefined },
  });
}

export async function enableConnector(
  connectorId: string,
  actorId: string,
  scope: TenantScope
) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, ...tenantWhere(scope) },
  });
  if (!connector) throw new Error("Connector not found");

  const updated = await prisma.integrationConnector.update({
    where: { id: connectorId },
    data: { enabled: true },
  });

  logAudit({
    actorId,
    action: "integration.connector.enable",
    resource: "IntegrationConnector",
    metadata: { connectorId, slug: connector.slug },
  });

  return updated;
}

export async function disableConnector(
  connectorId: string,
  actorId: string,
  scope: TenantScope
) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, ...tenantWhere(scope) },
  });
  if (!connector) throw new Error("Connector not found");

  const updated = await prisma.integrationConnector.update({
    where: { id: connectorId },
    data: { enabled: false },
  });

  logAudit({
    actorId,
    action: "integration.connector.disable",
    resource: "IntegrationConnector",
    metadata: { connectorId, slug: connector.slug },
  });

  return updated;
}

export async function patchConnectorConfig(
  connectorId: string,
  config: Record<string, unknown>,
  actorId: string,
  scope: TenantScope
) {
  const connector = await prisma.integrationConnector.findFirst({
    where: { id: connectorId, ...tenantWhere(scope) },
  });
  if (!connector) throw new Error("Connector not found");

  const updated = await prisma.integrationConnector.update({
    where: { id: connectorId },
    data: { config },
  });

  logAudit({
    actorId,
    action: "integration.connector.config",
    resource: "IntegrationConnector",
    metadata: { connectorId, slug: connector.slug, keys: Object.keys(config) },
  });

  return updated;
}

export async function runConnectorHealthChecks(scope: TenantScope) {
  const connectors = await listConnectorsForTenant(scope);
  const results = [];

  for (const c of connectors) {
    if (!c.enabled) continue;
    const def = getConnectorDefinition(c.slug);
    if (!def) continue;

    const instance = createConnectorInstance({
      connectorId: c.id,
      slug: c.slug,
      config: (c.config as Record<string, unknown>) ?? {},
      organizationId: c.organizationId,
      communityId: c.communityId,
    });

    if (!instance) continue;

    const health = await instance.healthCheck();
    await recordHealthCheck(c.id, health.status, health.message, health.metrics);
    results.push({ connectorId: c.id, slug: c.slug, ...health });
  }

  return results;
}

export async function getIntegrationHealth(scope: TenantScope) {
  const connectors = await listConnectorsForTenant(scope);
  const syncCounts = await prisma.integrationSyncLog.groupBy({
    by: ["status"],
    where: {
      connector: tenantWhere(scope),
      createdAt: { gte: new Date(Date.now() - 86400_000) },
    },
    _count: true,
  });

  return {
    connectors: connectors.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      enabled: c.enabled,
      category: c.category,
      health: c.health,
    })),
    syncLast24h: syncCounts,
  };
}

export async function getSyncLogs(scope: TenantScope, limit = 50) {
  return prisma.integrationSyncLog.findMany({
    where: { connector: tenantWhere(scope) },
    include: { connector: { select: { slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
