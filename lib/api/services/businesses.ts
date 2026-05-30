import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import { withinRadiusM } from "@/lib/geo/distance";
import type { BusinessDto, ServiceDto, BusinessAnalyticsDto } from "@/types/marketplace";

type BusinessRow = Prisma.BusinessGetPayload<object>;

export function mapBusiness(row: BusinessRow, extras?: Partial<BusinessDto>): BusinessDto {
  return {
    id: row.id,
    communityId: row.communityId,
    name: row.name,
    description: row.description,
    category: row.category,
    categories: row.categories ?? [],
    address: row.address,
    phone: row.phone,
    website: row.website,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    reviewCount: row.reviewCount,
    verified: row.verified,
    verificationBadges: row.verificationBadges ?? [],
    imageUrl: row.imageUrl,
    logoUrl: row.logoUrl,
    coverPhotoUrl: row.coverPhotoUrl,
    hours: (row.hours as Record<string, unknown>) ?? null,
    socialLinks: (row.socialLinks as Record<string, string>) ?? null,
    serviceAreas: row.serviceAreas ?? [],
    pricingRange: row.pricingRange,
    certifications: row.certifications ?? [],
    ...extras,
  };
}

export async function listBusinesses(input: {
  communityId: string;
  category?: string;
  search?: string;
  verified?: boolean;
  lat?: number;
  lng?: number;
  radiusM?: number;
  cursor?: string;
  limit?: number;
  userId?: string;
}) {
  const limit = input.limit ?? 20;
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;

  const items = await prisma.business.findMany({
    where: {
      communityId: input.communityId,
      ...(input.category ? { category: input.category } : {}),
      ...(input.verified ? { verified: true } : {}),
      ...(input.search
        ? {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: new Date(decoded.createdAt) } },
              { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ verified: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
  });

  let page = items;
  if (input.lat != null && input.lng != null && input.radiusM) {
    page = items.filter(
      (b) =>
        b.lat != null &&
        b.lng != null &&
        withinRadiusM(input.lat!, input.lng!, b.lat, b.lng, input.radiusM!)
    );
  }

  const hasMore = page.length > limit;
  const slice = hasMore ? page.slice(0, limit) : page;
  const last = slice[slice.length - 1];

  let favoritedIds = new Set<string>();
  if (input.userId && slice.length) {
    const favs = await prisma.favorite.findMany({
      where: {
        userId: input.userId,
        targetType: "BUSINESS",
        targetId: { in: slice.map((b) => b.id) },
      },
    });
    favoritedIds = new Set(favs.map((f) => f.targetId));
  }

  return {
    items: slice.map((b) =>
      mapBusiness(b, {
        favorited: favoritedIds.has(b.id),
        ...(input.lat != null && input.lng != null && b.lat != null && b.lng != null
          ? {
              distanceM: Math.round(
                Math.sqrt(
                  Math.pow((b.lat - input.lat!) * 111_000, 2) +
                    Math.pow((b.lng - input.lng!) * 85_000, 2)
                )
              ),
            }
          : {}),
      })
    ),
    nextCursor:
      hasMore && last ? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() }) : null,
    hasMore,
  };
}

export async function getBusiness(id: string, userId?: string) {
  const row = await prisma.business.findUnique({ where: { id } });
  if (!row) return null;
  await prisma.businessAnalytics.upsert({
    where: { businessId: id },
    create: { businessId: id, viewCount: 1 },
    update: { viewCount: { increment: 1 } },
  });
  let favorited = false;
  if (userId) {
    const f = await prisma.favorite.findUnique({
      where: { userId_targetType_targetId: { userId, targetType: "BUSINESS", targetId: id } },
    });
    favorited = !!f;
  }
  return mapBusiness(row, { favorited });
}

export async function createBusiness(data: Prisma.BusinessUncheckedCreateInput) {
  const row = await prisma.business.create({ data });
  await prisma.businessAnalytics.create({
    data: { businessId: row.id },
  });
  return mapBusiness(row);
}

export async function updateBusiness(
  id: string,
  data: Prisma.BusinessUpdateInput,
  ownerId?: string
) {
  const existing = await prisma.business.findUnique({ where: { id } });
  if (!existing) return null;
  if (ownerId && existing.ownerId !== ownerId) return null;
  const row = await prisma.business.update({ where: { id }, data });
  return mapBusiness(row);
}

export async function listBusinessServices(businessId: string): Promise<ServiceDto[]> {
  const rows = await prisma.service.findMany({
    where: { businessId, active: true },
  });
  return rows.map((s) => ({
    id: s.id,
    businessId: s.businessId,
    name: s.name,
    description: s.description,
    category: s.category,
    priceFrom: s.priceFrom,
    priceTo: s.priceTo,
    availability: s.availability,
    serviceRadiusM: s.serviceRadiusM,
  }));
}

export async function getBusinessAnalytics(businessId: string): Promise<BusinessAnalyticsDto | null> {
  const row = await prisma.businessAnalytics.findUnique({ where: { businessId } });
  if (!row) {
    return {
      businessId,
      viewCount: 0,
      inquiryCount: 0,
      listingViews: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    businessId: row.businessId,
    viewCount: row.viewCount,
    inquiryCount: row.inquiryCount,
    listingViews: row.listingViews,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function nearbyBusinesses(
  communityId: string,
  lat: number,
  lng: number,
  radiusM: number
) {
  const items = await prisma.business.findMany({
    where: { communityId, lat: { not: null }, lng: { not: null } },
    take: 100,
  });
  return items
    .filter((b) => b.lat != null && b.lng != null && withinRadiusM(lat, lng, b.lat, b.lng, radiusM))
    .map((b) => mapBusiness(b));
}
