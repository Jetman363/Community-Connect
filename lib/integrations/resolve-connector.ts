import { prisma } from "@/lib/prisma";
import { createConnectorInstance } from "./registry";
import type { BaseConnector } from "./base-connector";
import type { TenantScope } from "./types";

export async function resolveConnectorBySlug(
  slug: string,
  scope: TenantScope,
  requireEnabled = true
): Promise<{ connector: BaseConnector; id: string } | null> {
  const row = await prisma.integrationConnector.findFirst({
    where: {
      slug,
      ...(requireEnabled ? { enabled: true } : {}),
      ...(scope.organizationId != null ? { organizationId: scope.organizationId } : {}),
      ...(scope.communityId != null ? { communityId: scope.communityId } : {}),
    },
  });

  if (!row) return null;

  const instance = createConnectorInstance({
    connectorId: row.id,
    slug: row.slug,
    config: (row.config as Record<string, unknown>) ?? {},
    organizationId: row.organizationId,
    communityId: row.communityId,
  });

  if (!instance) return null;
  return { connector: instance, id: row.id };
}
