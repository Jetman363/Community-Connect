import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { marketplaceSchema, marketplaceQuerySchema } from "@/lib/validations";
import {
  listListings,
  createListing,
  getDefaultCommunityId,
} from "@/lib/api/services/marketplace";
import { getMockMarketplaceListings } from "@/lib/api/fallback-marketplace";
import { suggestMarketplaceCategory } from "@/lib/ai/marketplace-categorization";
import { checkListingScamRisk } from "@/lib/ai/scam-detection";
import { broadcastListingNew } from "@/lib/realtime/marketplace-broadcast";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = marketplaceQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        const items = getMockMarketplaceListings();
        return jsonOk({ items, nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const result = await withDbTimeout(
      listListings({ communityId, userId, ...parsed.data })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockMarketplaceListings(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Failed to load listings", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "marketplace-create"), 8, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = marketplaceSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  const scam = checkListingScamRisk(parsed.data.title, parsed.data.description);
  if (scam.risk === "high") {
    return jsonError("Listing flagged for review", 400, { flags: scam.flags });
  }

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const category =
      parsed.data.category ??
      suggestMarketplaceCategory(parsed.data.title, parsed.data.description);

    const listing = await withDbTimeout(
      createListing({
        communityId,
        sellerId: auth.payload.sub,
        title: parsed.data.title,
        description: parsed.data.description,
        price: parsed.data.price,
        negotiable: parsed.data.negotiable ?? false,
        type: parsed.data.type ?? "FOR_SALE",
        category,
        imageUrl: parsed.data.imageUrl,
        imageGallery: parsed.data.imageGallery,
        videoUrl: parsed.data.videoUrl,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        locationLabel: parsed.data.locationLabel,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        status: scam.risk === "medium" ? "PENDING" : "ACTIVE",
      })
    );

    broadcastListingNew(communityId, listing);
    return jsonOk({ ...listing, suggestedCategory: category, scamCheck: scam }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create listing", 500);
  }
}
