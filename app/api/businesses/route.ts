import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { businessSchema, businessQuerySchema } from "@/lib/validations";
import { listBusinesses, createBusiness, toBusinessCreateInput } from "@/lib/api/services/businesses";
import { getDefaultCommunityId } from "@/lib/api/services/marketplace";
import { getMockBusinessesDto } from "@/lib/api/fallback-marketplace";
import { canManageBusiness } from "@/lib/permissions/rbac";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = businessQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockBusinessesDto(), nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }
    const result = await withDbTimeout(
      listBusinesses({ communityId, userId, ...parsed.data })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockBusinessesDto(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Failed to load businesses", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "business-create"), 5, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canManageBusiness(auth.payload.role)) {
    return jsonError("Business owner role required", 403);
  }

  const body = await req.json();
  const parsed = businessSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const business = await withDbTimeout(
      createBusiness({
        communityId,
        ownerId: auth.payload.sub,
        ...toBusinessCreateInput(parsed.data),
      })
    );
    return jsonOk(business, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create business", 500);
  }
}
