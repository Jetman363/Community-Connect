import type { AlertCategory, AlertSeverity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import { bboxFromCenter, haversineMeters, withinRadiusM } from "@/lib/geo/distance";
import type { SafetyAlertDto } from "@/types/safety";

type AlertRow = Prisma.SafetyAlertGetPayload<{
  include: { _count: { select: { acknowledgments: true } } };
}>;

function mapAlert(
  a: AlertRow,
  userId?: string,
  extras?: { acknowledged?: boolean; bookmarked?: boolean }
): SafetyAlertDto {
  return {
    id: a.id,
    communityId: a.communityId,
    title: a.title,
    description: a.description,
    category: a.category,
    severity: a.severity,
    lat: a.lat,
    lng: a.lng,
    radiusM: a.radiusM,
    locationLabel: a.locationLabel,
    active: a.active,
    source: a.source,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString() ?? null,
    acknowledged: extras?.acknowledged ?? false,
    bookmarked: extras?.bookmarked ?? false,
    ackCount: a._count?.acknowledgments,
  };
}

export async function getDefaultCommunityId(userId: string): Promise<string | null> {
  const m = await prisma.communityMember.findFirst({
    where: { userId, status: "ACTIVE" },
    select: { communityId: true },
  });
  return m?.communityId ?? null;
}

export interface ListAlertsInput {
  communityId: string;
  userId?: string;
  category?: AlertCategory;
  severity?: AlertSeverity;
  lat?: number;
  lng?: number;
  radiusM?: number;
  search?: string;
  history?: boolean;
  cursor?: string;
  limit?: number;
}

export async function listAlerts(input: ListAlertsInput) {
  const limit = input.limit ?? 20;
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;
  const now = new Date();

  const bbox =
    input.lat != null && input.lng != null && input.radiusM
      ? bboxFromCenter(input.lat, input.lng, input.radiusM)
      : null;

  const items = await prisma.safetyAlert.findMany({
    where: {
      communityId: input.communityId,
      ...(input.history ? {} : { active: true }),
      ...(input.history ? {} : { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }),
      ...(input.category ? { category: input.category } : {}),
      ...(input.severity ? { severity: input.severity } : {}),
      ...(input.search
        ? {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(bbox
        ? {
            lat: { gte: bbox.minLat, lte: bbox.maxLat },
            lng: { gte: bbox.minLng, lte: bbox.maxLng },
          }
        : {}),
      ...(decoded ? { createdAt: { lt: new Date(decoded.t) } } : {}),
    },
    include: { _count: { select: { acknowledgments: true } } },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  let page = items;
  if (input.lat != null && input.lng != null && input.radiusM) {
    page = items.filter(
      (a) =>
        a.lat != null &&
        a.lng != null &&
        withinRadiusM(input.lat!, input.lng!, a.lat, a.lng, input.radiusM!)
    );
  }

  const hasMore = page.length > limit;
  const slice = hasMore ? page.slice(0, limit) : page;
  const last = slice[slice.length - 1];

  let ackSet = new Set<string>();
  let bookmarkSet = new Set<string>();
  if (input.userId && slice.length) {
    const ids = slice.map((a) => a.id);
    const [acks, bookmarks] = await Promise.all([
      prisma.alertAcknowledgment.findMany({
        where: { userId: input.userId, alertId: { in: ids } },
        select: { alertId: true },
      }),
      prisma.alertBookmark.findMany({
        where: { userId: input.userId, alertId: { in: ids } },
        select: { alertId: true },
      }),
    ]);
    ackSet = new Set(acks.map((a) => a.alertId));
    bookmarkSet = new Set(bookmarks.map((b) => b.alertId));
  }

  return {
    items: slice.map((a) =>
      mapAlert(a, input.userId, {
        acknowledged: ackSet.has(a.id),
        bookmarked: bookmarkSet.has(a.id),
      })
    ),
    nextCursor: hasMore && last ? encodeCursor(last.id, last.createdAt) : null,
    hasMore,
  };
}

export async function createAlert(data: {
  communityId: string;
  createdById: string;
  title: string;
  description: string;
  category?: AlertCategory;
  severity?: AlertSeverity;
  lat?: number;
  lng?: number;
  radiusM?: number;
  locationLabel?: string;
  source?: string;
  expiresAt?: Date;
}) {
  return prisma.safetyAlert.create({
    data: {
      communityId: data.communityId,
      createdById: data.createdById,
      title: data.title,
      description: data.description,
      category: data.category ?? "OTHER",
      severity: data.severity ?? "INFO",
      lat: data.lat,
      lng: data.lng,
      radiusM: data.radiusM,
      locationLabel: data.locationLabel,
      source: data.source,
      expiresAt: data.expiresAt,
    },
    include: { _count: { select: { acknowledgments: true } } },
  });
}

export async function updateAlert(
  id: string,
  communityId: string,
  data: Prisma.SafetyAlertUpdateInput
) {
  return prisma.safetyAlert.update({
    where: { id, communityId },
    data,
    include: { _count: { select: { acknowledgments: true } } },
  });
}

export async function getAlertById(id: string, communityId: string, userId?: string) {
  const a = await prisma.safetyAlert.findFirst({
    where: { id, communityId },
    include: { _count: { select: { acknowledgments: true } } },
  });
  if (!a) return null;
  let acknowledged = false;
  let bookmarked = false;
  if (userId) {
    const [ack, bm] = await Promise.all([
      prisma.alertAcknowledgment.findUnique({
        where: { userId_alertId: { userId, alertId: id } },
      }),
      prisma.alertBookmark.findUnique({
        where: { userId_alertId: { userId, alertId: id } },
      }),
    ]);
    acknowledged = !!ack;
    bookmarked = !!bm;
  }
  return mapAlert(a, userId, { acknowledged, bookmarked });
}

export async function acknowledgeAlert(alertId: string, userId: string) {
  await prisma.alertAcknowledgment.upsert({
    where: { userId_alertId: { userId, alertId } },
    create: { userId, alertId },
    update: {},
  });
  return prisma.safetyAlert.findUnique({
    where: { id: alertId },
    include: { _count: { select: { acknowledgments: true } } },
  });
}

export async function bookmarkAlert(alertId: string, userId: string) {
  await prisma.alertBookmark.upsert({
    where: { userId_alertId: { userId, alertId } },
    create: { userId, alertId },
    update: {},
  });
}

export async function unbookmarkAlert(alertId: string, userId: string) {
  await prisma.alertBookmark.deleteMany({ where: { userId, alertId } });
}

export { mapAlert, haversineMeters };
