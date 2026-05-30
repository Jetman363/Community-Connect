import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logGatewayAudit(params: {
  action: string;
  connectorId?: string;
  organizationId?: string | null;
  communityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      resource: "gateway",
      resourceId: params.connectorId,
      organizationId: params.organizationId ?? undefined,
      communityId: params.communityId ?? undefined,
      metadata: params.metadata ?? undefined,
      ip: params.ip,
    },
  });
}
