import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface WriteAuditLogInput {
  actorId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  communityId?: string | null;
  organizationId?: string | null;
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata ?? undefined,
      ip: input.ip ?? undefined,
      communityId: input.communityId ?? undefined,
      organizationId: input.organizationId ?? undefined,
    },
  });
}

export async function searchAuditLogs(opts: {
  communityId?: string;
  organizationId?: string;
  action?: string;
  resource?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const limit = Math.min(opts.limit ?? 50, 100);
  const page = opts.page ?? 1;
  const where: Prisma.AuditLogWhereInput = {};

  if (opts.communityId) where.communityId = opts.communityId;
  if (opts.organizationId) where.organizationId = opts.organizationId;
  if (opts.action) where.action = { contains: opts.action, mode: "insensitive" };
  if (opts.resource) where.resource = opts.resource;
  if (opts.actorId) where.actorId = opts.actorId;
  if (opts.from || opts.to) {
    where.createdAt = {};
    if (opts.from) where.createdAt.gte = opts.from;
    if (opts.to) where.createdAt.lte = opts.to;
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { include: { profile: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: items.map((l) => ({
      id: l.id,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      metadata: l.metadata,
      ip: l.ip,
      communityId: l.communityId,
      organizationId: l.organizationId,
      createdAt: l.createdAt.toISOString(),
      actor: l.actor
        ? {
            id: l.actor.id,
            displayName: l.actor.profile?.displayName ?? l.actor.email,
          }
        : null,
    })),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export function auditLogsToCsv(
  items: { createdAt: string; action: string; resource: string | null; resourceId: string | null; actor: { displayName: string } | null }[]
): string {
  const header = "createdAt,action,resource,resourceId,actor";
  const rows = items.map(
    (i) =>
      `${i.createdAt},${escapeCsv(i.action)},${escapeCsv(i.resource ?? "")},${escapeCsv(i.resourceId ?? "")},${escapeCsv(i.actor?.displayName ?? "")}`
  );
  return [header, ...rows].join("\n");
}

function escapeCsv(v: string): string {
  if (v.includes(",") || v.includes('"')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
