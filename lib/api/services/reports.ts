import type { IncidentCategory, ReportSeverity, ReportStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import { suggestIncidentCategory } from "@/lib/ai/incident-categorization";
import { bboxFromCenter, withinRadiusM } from "@/lib/geo/distance";
import type { IncidentReportDto } from "@/types/safety";

const REPORT_INCLUDE = {
  reporter: { select: { id: true, profile: { select: { displayName: true } } } },
  assignedTo: { select: { id: true, profile: { select: { displayName: true } } } },
} as const;

type ReportRow = Prisma.ReportGetPayload<{ include: typeof REPORT_INCLUDE }>;

export function mapReport(r: ReportRow, viewerId?: string): IncidentReportDto {
  const showReporter = !r.anonymous || r.reporterId === viewerId;
  return {
    id: r.id,
    communityId: r.communityId,
    title: r.title,
    description: r.description,
    category: r.category,
    severity: r.severity,
    suggestedCategory: r.suggestedCategory,
    status: r.status,
    anonymous: r.anonymous,
    lat: r.lat,
    lng: r.lng,
    locationLabel: r.locationLabel,
    mediaUrls: r.mediaUrls,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    reporter: showReporter
      ? {
          id: r.reporter.id,
          displayName: r.reporter.profile?.displayName ?? "Neighbor",
        }
      : null,
    assignedTo: r.assignedTo
      ? {
          id: r.assignedTo.id,
          displayName: r.assignedTo.profile?.displayName ?? "Staff",
        }
      : null,
  };
}

export interface ListReportsInput {
  communityId: string;
  userId?: string;
  status?: ReportStatus;
  category?: IncidentCategory;
  lat?: number;
  lng?: number;
  radiusM?: number;
  cursor?: string;
  limit?: number;
}

export async function listReports(input: ListReportsInput) {
  const limit = input.limit ?? 20;
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;
  const bbox =
    input.lat != null && input.lng != null && input.radiusM
      ? bboxFromCenter(input.lat, input.lng, input.radiusM)
      : null;

  const items = await prisma.report.findMany({
    where: {
      communityId: input.communityId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(bbox
        ? {
            lat: { gte: bbox.minLat, lte: bbox.maxLat },
            lng: { gte: bbox.minLng, lte: bbox.maxLng },
          }
        : {}),
      ...(decoded ? { createdAt: { lt: new Date(decoded.t) } } : {}),
    },
    include: REPORT_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  let page = items;
  if (input.lat != null && input.lng != null && input.radiusM) {
    page = items.filter(
      (r) =>
        r.lat != null &&
        r.lng != null &&
        withinRadiusM(input.lat!, input.lng!, r.lat, r.lng, input.radiusM!)
    );
  }

  const hasMore = page.length > limit;
  const slice = hasMore ? page.slice(0, limit) : page;
  const last = slice[slice.length - 1];

  return {
    items: slice.map((r) => mapReport(r, input.userId)),
    nextCursor: hasMore && last ? encodeCursor(last.id, last.createdAt) : null,
    hasMore,
  };
}

export async function createReport(input: {
  communityId: string;
  reporterId: string;
  title: string;
  description: string;
  category?: IncidentCategory;
  severity?: ReportSeverity;
  anonymous?: boolean;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  mediaUrls?: string[];
}) {
  const suggestion = await suggestIncidentCategory(input.title, input.description);
  const row = await prisma.report.create({
    data: {
      communityId: input.communityId,
      reporterId: input.reporterId,
      title: input.title,
      description: input.description,
      category: input.category ?? suggestion.suggestedCategory,
      severity: input.severity ?? "MODERATE",
      suggestedCategory: suggestion.suggestedCategory,
      anonymous: input.anonymous ?? false,
      lat: input.lat,
      lng: input.lng,
      locationLabel: input.locationLabel,
      mediaUrls: input.mediaUrls ?? [],
    },
    include: REPORT_INCLUDE,
  });
  return mapReport(row, input.reporterId);
}

export async function getReportById(id: string, communityId: string, viewerId?: string) {
  const r = await prisma.report.findFirst({
    where: { id, communityId },
    include: REPORT_INCLUDE,
  });
  return r ? mapReport(r, viewerId) : null;
}

export async function updateReport(
  id: string,
  communityId: string,
  data: Prisma.ReportUpdateInput,
  viewerId?: string
) {
  const r = await prisma.report.update({
    where: { id, communityId },
    data,
    include: REPORT_INCLUDE,
  });
  return mapReport(r, viewerId);
}

export async function appendReportMedia(id: string, communityId: string, urls: string[]) {
  const existing = await prisma.report.findFirst({ where: { id, communityId } });
  if (!existing) return null;
  return updateReport(id, communityId, {
    mediaUrls: [...existing.mediaUrls, ...urls],
  });
}

export async function getReportQueue(communityId: string, limit = 50) {
  return listReports({
    communityId,
    status: "SUBMITTED",
    limit,
  });
}
