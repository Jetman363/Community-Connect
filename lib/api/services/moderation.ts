import type { ContentEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/api/sanitize";

export async function createContentReport(input: {
  reporterId: string;
  entityType: ContentEntityType;
  entityId: string;
  reason: string;
  details?: string;
}) {
  return prisma.contentReport.create({
    data: {
      reporterId: input.reporterId,
      entityType: input.entityType,
      entityId: input.entityId,
      reason: sanitizeText(input.reason),
      details: input.details ? sanitizeText(input.details) : undefined,
    },
  });
}

export async function listModerationQueue(limit = 50) {
  return prisma.contentReport.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: {
        select: {
          id: true,
          profile: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
