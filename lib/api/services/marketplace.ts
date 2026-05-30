import type { ListingStatus, MarketplaceCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encodeCursor, decodeCursor } from "@/lib/api/pagination";
import { bboxFromCenter, withinRadiusM } from "@/lib/geo/distance";
import type { MarketplaceListingDto } from "@/types/marketplace";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";

export { getDefaultCommunityId };

type ListingRow = Prisma.MarketplaceListingGetPayload<{
  include: { seller: { include: { profile: true } } };
}>;

function galleryUrls(g: unknown): string[] {
  if (!g) return [];
  if (Array.isArray(g)) return g.filter((x): x is string => typeof x === "string");
  return [];
}

export function mapListing(
  row: ListingRow,
  extras?: { favorited?: boolean }
): MarketplaceListingDto {
  return {
    id: row.id,
    communityId: row.communityId,
    title: row.title,
    description: row.description,
    price: row.price,
    negotiable: row.negotiable,
    type: row.type,
    category: row.category,
    status: row.status,
    imageUrl: row.imageUrl,
    imageGallery: galleryUrls(row.imageGallery),
    videoUrl: row.videoUrl,
    lat: row.lat,
    lng: row.lng,
    locationLabel: row.locationLabel,
    featured: row.featured,
    promoted: row.promoted,
    viewCount: row.viewCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    seller: {
      id: row.seller.id,
      displayName: row.seller.profile?.displayName ?? "Neighbor",
      avatarUrl: row.seller.profile?.avatarUrl,
    },
    favorited: extras?.favorited,
  };
}

const listingInclude = {
  seller: { include: { profile: true } },
} as const;

export interface ListListingsInput {
  communityId: string;
  userId?: string;
  category?: MarketplaceCategory;
  status?: ListingStatus;
  search?: string;
  featured?: boolean;
  lat?: number;
  lng?: number;
  radiusM?: number;
  priceMin?: number;
  priceMax?: number;
  cursor?: string;
  limit?: number;
}

export async function listListings(input: ListListingsInput) {
  const limit = input.limit ?? 20;
  const decoded = input.cursor ? decodeCursor(input.cursor) : null;
  const now = new Date();

  const items = await prisma.marketplaceListing.findMany({
    where: {
      communityId: input.communityId,
      status: input.status ?? "ACTIVE",
      ...(input.category ? { category: input.category } : {}),
      ...(input.featured ? { featured: true } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(input.search
        ? {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(input.priceMin != null ? { price: { gte: input.priceMin } } : {}),
      ...(input.priceMax != null ? { price: { lte: input.priceMax } } : {}),
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: new Date(decoded.createdAt) } },
              { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
            ],
          }
        : {}),
    },
    include: listingInclude,
    orderBy: [{ promoted: "desc" }, { featured: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  let filtered = items;
  if (input.lat != null && input.lng != null && input.radiusM) {
    filtered = items.filter(
      (l) =>
        l.lat != null &&
        l.lng != null &&
        withinRadiusM(input.lat!, input.lng!, l.lat, l.lng, input.radiusM!)
    );
  }

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  const last = page[page.length - 1];

  let favoritedIds = new Set<string>();
  if (input.userId && page.length) {
    const favs = await prisma.favorite.findMany({
      where: {
        userId: input.userId,
        targetType: "LISTING",
        targetId: { in: page.map((p) => p.id) },
      },
    });
    favoritedIds = new Set(favs.map((f) => f.targetId));
  }

  return {
    items: page.map((r) => mapListing(r, { favorited: favoritedIds.has(r.id) })),
    nextCursor:
      hasMore && last ? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() }) : null,
    hasMore,
  };
}

export async function getListing(id: string, userId?: string) {
  const row = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: listingInclude,
  });
  if (!row) return null;
  await prisma.marketplaceListing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
  let favorited = false;
  if (userId) {
    const f = await prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: { userId, targetType: "LISTING", targetId: id },
      },
    });
    favorited = !!f;
  }
  return mapListing({ ...row, viewCount: row.viewCount + 1 }, { favorited });
}

export async function createListing(
  data: Prisma.MarketplaceListingUncheckedCreateInput
) {
  const row = await prisma.marketplaceListing.create({
    data,
    include: listingInclude,
  });
  return mapListing(row);
}

export async function updateListing(
  id: string,
  data: Prisma.MarketplaceListingUpdateInput,
  sellerId?: string
) {
  const existing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!existing) return null;
  if (sellerId && existing.sellerId !== sellerId) return null;
  const row = await prisma.marketplaceListing.update({
    where: { id },
    data,
    include: listingInclude,
  });
  return mapListing(row);
}

export async function deleteListing(id: string, sellerId?: string) {
  const existing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!existing) return false;
  if (sellerId && existing.sellerId !== sellerId) return false;
  await prisma.marketplaceListing.update({
    where: { id },
    data: { status: "REMOVED" },
  });
  return true;
}

export async function searchListings(input: ListListingsInput & { verified?: boolean }) {
  return listListings(input);
}

export async function getFeaturedListings(communityId: string, limit = 6) {
  return listListings({ communityId, featured: true, limit });
}

export async function getTrendingListings(communityId: string, limit = 8) {
  const items = await prisma.marketplaceListing.findMany({
    where: { communityId, status: "ACTIVE" },
    include: listingInclude,
    orderBy: { viewCount: "desc" },
    take: limit,
  });
  return items.map((r) => mapListing(r));
}

export async function bboxListings(
  communityId: string,
  lat: number,
  lng: number,
  radiusM: number
) {
  const bbox = bboxFromCenter(lat, lng, radiusM);
  const items = await prisma.marketplaceListing.findMany({
    where: {
      communityId,
      status: "ACTIVE",
      lat: { gte: bbox.minLat, lte: bbox.maxLat },
      lng: { gte: bbox.minLng, lte: bbox.maxLng },
    },
    include: listingInclude,
    take: 100,
  });
  return items
    .filter((l) => l.lat != null && l.lng != null && withinRadiusM(lat, lng, l.lat, l.lng, radiusM))
    .map((r) => mapListing(r));
}
