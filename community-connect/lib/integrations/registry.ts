import { prisma } from "@/lib/prisma";
import type { ConnectorCategory } from "@prisma/client";
import type { BaseConnector, ConnectorFactory } from "./base-connector";
import type { ConnectorContext } from "./base-connector";
import type { ConnectorDefinition, ConnectorInstance, TenantScope } from "./types";
import { MockCadConnector } from "./connectors/cad/mock-cad-connector";
import { GenericCadAdapter } from "./connectors/cad/generic-cad-adapter";
import { MockRmsConnector } from "./connectors/rms/mock-rms-connector";
import { GenericRmsAdapter } from "./connectors/rms/generic-rms-adapter";
import { MockTrafficConnector } from "./connectors/smart-city/mock-traffic-connector";
import { MockWeatherConnector } from "./connectors/smart-city/mock-weather-connector";

/** Static connector catalog — config-driven enable/disable via DB */
export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  {
    slug: "mock-cad",
    name: "Mock CAD (Dev)",
    category: "PUBLIC_SAFETY",
    adapterKey: "mock-cad",
    description: "Development mock computer-aided dispatch feed",
    supportedEvents: ["incident.created", "unit.status", "dispatch.notification"],
  },
  {
    slug: "generic-cad",
    name: "Generic CAD Adapter",
    category: "PUBLIC_SAFETY",
    adapterKey: "generic-cad",
    description: "Vendor-agnostic CAD webhook adapter",
    supportedEvents: ["incident.created", "unit.status"],
  },
  {
    slug: "mock-rms",
    name: "Mock RMS (Dev)",
    category: "PUBLIC_SAFETY",
    adapterKey: "mock-rms",
    description: "Development mock records management sync",
    supportedEvents: ["report.synced", "case.synced"],
  },
  {
    slug: "generic-rms",
    name: "Generic RMS Adapter",
    category: "PUBLIC_SAFETY",
    adapterKey: "generic-rms",
    description: "Vendor-agnostic RMS sync adapter",
    supportedEvents: ["report.synced", "case.synced"],
  },
  {
    slug: "mock-traffic",
    name: "Mock Smart City Traffic",
    category: "SMART_CITY",
    adapterKey: "mock-traffic",
    description: "Traffic sensor events (mock)",
    supportedEvents: ["traffic.congestion", "traffic.incident"],
  },
  {
    slug: "mock-weather",
    name: "Mock Smart City Weather",
    category: "SMART_CITY",
    adapterKey: "mock-weather",
    description: "Weather alerts (mock)",
    supportedEvents: ["weather.alert"],
  },
];

const FACTORIES: Record<string, ConnectorFactory> = {
  "mock-cad": { create: (ctx) => new MockCadConnector(ctx) },
  "generic-cad": { create: (ctx) => new GenericCadAdapter(ctx) },
  "mock-rms": { create: (ctx) => new MockRmsConnector(ctx) },
  "generic-rms": { create: (ctx) => new GenericRmsAdapter(ctx) },
  "mock-traffic": { create: (ctx) => new MockTrafficConnector(ctx) },
  "mock-weather": { create: (ctx) => new MockWeatherConnector(ctx) },
};

export function getConnectorDefinition(slug: string): ConnectorDefinition | undefined {
  return CONNECTOR_CATALOG.find((c) => c.slug === slug);
}

export function listCatalogByCategory(category?: ConnectorCategory): ConnectorDefinition[] {
  if (!category) return CONNECTOR_CATALOG;
  return CONNECTOR_CATALOG.filter((c) => c.category === category);
}

export function createConnectorInstance(ctx: ConnectorContext): BaseConnector | null {
  const def = getConnectorDefinition(ctx.slug);
  if (!def) return null;
  const factory = FACTORIES[def.adapterKey];
  if (!factory) return null;
  return factory.create(ctx);
}

function scopeWhere(scope: TenantScope) {
  return {
    ...(scope.organizationId != null ? { organizationId: scope.organizationId } : {}),
    ...(scope.communityId != null ? { communityId: scope.communityId } : {}),
  };
}

export async function listEnabledConnectors(scope: TenantScope): Promise<ConnectorInstance[]> {
  const rows = await prisma.integrationConnector.findMany({
    where: { enabled: true, ...scopeWhere(scope) },
  });
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    enabled: r.enabled,
    config: (r.config as Record<string, unknown>) ?? {},
    organizationId: r.organizationId,
    communityId: r.communityId,
  }));
}

export async function listConnectorsForTenant(scope: TenantScope) {
  const rows = await prisma.integrationConnector.findMany({
    where: scopeWhere(scope),
    include: {
      healthChecks: { orderBy: { lastCheck: "desc" }, take: 1 },
    },
    orderBy: { slug: "asc" },
  });

  return rows.map((r) => {
    const def = getConnectorDefinition(r.slug);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      enabled: r.enabled,
      config: r.config,
      organizationId: r.organizationId,
      communityId: r.communityId,
      catalog: def,
      health: r.healthChecks[0] ?? null,
    };
  });
}

export async function getEnabledConnectorBySlug(
  slug: string,
  scope: TenantScope
): Promise<ConnectorInstance | null> {
  const row = await prisma.integrationConnector.findFirst({
    where: { slug, enabled: true, ...scopeWhere(scope) },
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    enabled: row.enabled,
    config: (row.config as Record<string, unknown>) ?? {},
    organizationId: row.organizationId,
    communityId: row.communityId,
  };
}

export function isMockEnabledInDev(slug: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_MOCK_CONNECTORS === "true" &&
    slug.startsWith("mock-")
  );
}
