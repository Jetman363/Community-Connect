import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getBusinessAnalytics } from "@/lib/api/services/businesses";
import { canAdmin, canManageBusiness } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  const { id } = await params;

  try {
    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return jsonError("Not found", 404);
    const isOwner = business.ownerId === auth.payload.sub;
    if (!isOwner && !canAdmin(auth.payload.role) && !canManageBusiness(auth.payload.role)) {
      return jsonError("Forbidden", 403);
    }
    const analytics = await withDbTimeout(getBusinessAnalytics(id));
    return jsonOk(analytics);
  } catch (err) {
    if (isDbUnavailable(err)) {
      return jsonOk({
        businessId: id,
        viewCount: 0,
        inquiryCount: 0,
        listingViews: 0,
        updatedAt: new Date().toISOString(),
        source: "placeholder",
      });
    }
    return jsonError("Failed to load analytics", 500);
  }
}
