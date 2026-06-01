import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { updateMarketplaceSchema } from "@/lib/validations";
import {
  getListing,
  updateListing,
  deleteListing,
} from "@/lib/api/services/marketplace";
import { getMockMarketplaceListings } from "@/lib/api/fallback-marketplace";
import { broadcastListingUpdate, broadcastListingSold } from "@/lib/realtime/marketplace-broadcast";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  try {
    const listing = await withDbTimeout(getListing(id, userId));
    if (!listing) return jsonError("Not found", 404);
    return jsonOk(listing);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const mock = getMockMarketplaceListings().find((l) => l.id === id);
      if (mock) return jsonOk(mock);
    }
    return jsonError("Failed to load listing", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateMarketplaceSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const listing = await withDbTimeout(
      updateListing(
        id,
        {
          ...parsed.data,
          expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
          imageGallery: parsed.data.imageGallery,
        },
        auth.payload.sub
      )
    );
    if (!listing) return jsonError("Not found or forbidden", 404);
    if (listing.status === "SOLD") {
      broadcastListingSold(listing.communityId, listing);
    } else {
      broadcastListingUpdate(listing.communityId, listing);
    }
    return jsonOk(listing);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update listing", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;
  try {
    const ok = await withDbTimeout(deleteListing(id, auth.payload.sub));
    if (!ok) return jsonError("Not found or forbidden", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to delete listing", 500);
  }
}
