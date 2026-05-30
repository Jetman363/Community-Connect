import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { alertsQuerySchema, alertSchema } from "@/lib/validations";
import {
  listAlerts,
  createAlert,
  mapAlert,
  getDefaultCommunityId,
} from "@/lib/api/services/alerts";
import { getMockSafetyAlerts } from "@/lib/api/fallback-safety";
import { canPublishSafetyAlert } from "@/lib/permissions/rbac";
import { broadcastNewAlert } from "@/lib/realtime/safety-broadcast";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = alertsQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);

    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        return jsonOk({ items: getMockSafetyAlerts(), nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }

    const result = await withDbTimeout(
      listAlerts({
        communityId,
        userId,
        ...parsed.data,
      })
    );
    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockSafetyAlerts(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Failed to load alerts", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "alerts-create"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canPublishSafetyAlert(auth.payload.role)) {
    return jsonError("Forbidden — public safety or moderator role required", 403);
  }

  const body = await req.json();
  const parsed = alertSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const alert = await withDbTimeout(
      createAlert({
        communityId,
        createdById: auth.payload.sub,
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      })
    );

    const dto = mapAlert(alert);
    await broadcastNewAlert({
      id: alert.id,
      communityId,
      title: alert.title,
      severity: alert.severity,
      lat: alert.lat,
      lng: alert.lng,
    });

    return jsonOk(dto, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create alert", 500);
  }
}
