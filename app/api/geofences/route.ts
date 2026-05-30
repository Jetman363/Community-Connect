import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { geofenceSchema } from "@/lib/validations";
import { listGeofences, createGeofence } from "@/lib/api/services/geofences";
import { getDefaultCommunityId } from "@/lib/api/services/alerts";
import { canModerate } from "@/lib/permissions/rbac";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) return jsonError("No community context", 400);

    const zones = await withDbTimeout(listGeofences(communityId));
    return jsonOk({ items: zones, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonOk({ items: [], source: "mock" });
    return jsonError("Failed to load geofences", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canModerate(auth.payload.role)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = geofenceSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community context", 400);

    const zone = await withDbTimeout(
      createGeofence({ communityId, ...parsed.data })
    );
    return jsonOk(zone, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create geofence", 500);
  }
}
