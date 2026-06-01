import { prisma } from "@/lib/prisma";
import { withDbTimeout } from "@/lib/db/timeout";
import type { Prisma } from "@prisma/client";

export function logAudit(params: {
  actorId?: string;
  action: string;
  resource?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}): void {
  void withDbTimeout(
    prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        resource: params.resource,
        metadata: params.metadata ?? undefined,
        ip: params.ip,
      },
    }),
    3000
  ).catch(() => {
    // Non-blocking if DB unavailable
  });
}
