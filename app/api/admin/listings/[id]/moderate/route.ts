import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { canModerate } from "@/lib/permissions/rbac";
import { moderateListing } from "@/lib/api/services/marketplace";
import { broadcastListingUpdate } from "@/lib/realtime/marketplace-broadcast";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ListingStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "SOLD", "CLOSED", "EXPIRED", "FLAGGED", "REMOVED"]),
  featured: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canModerate(auth.payload.role)) return jsonError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const listing = await withDbTimeout(
      moderateListing(id, parsed.data.status as ListingStatus, parsed.data.featured)
    );
    const row = await prisma.marketplaceListing.findUnique({
      where: { id },
      select: { communityId: true },
    });
    if (row) broadcastListingUpdate(row.communityId, listing);
    return jsonOk(listing);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to moderate listing", 500);
  }
}
