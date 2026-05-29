import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  actorId?: string;
  action: string;
  resource?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        resource: params.resource,
        metadata: params.metadata ?? undefined,
        ip: params.ip,
      },
    });
  } catch {
    // Non-blocking if DB unavailable
  }
}
