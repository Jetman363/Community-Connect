import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { updateAlertSchema } from "@/lib/validations";
import {
  getAlertById,
  updateAlert,
  mapAlert,
  getDefaultCommunityId,
} from "@/lib/api/services/alerts";
import { canPublishSafetyAlert } from "@/lib/permissions/rbac";
import { broadcastAlertUpdate } from "@/lib/realtime/safety-broadcast";
import { SOCKET_EVENTS, emitToCommunity } from "@/lib/realtime/emit";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);
    if (!communityId) return jsonError("No community context", 400);

    const alert = await withDbTimeout(getAlertById(id, communityId, userId));
    if (!alert) return jsonError("Not found", 404);
    return jsonOk(alert);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load alert", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;
  if (!canPublishSafetyAlert(auth.payload.role)) {
    return jsonError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateAlertSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community context", 400);

    const prev = await getAlertById(id, communityId);
    const alert = await withDbTimeout(
      updateAlert(id, communityId, {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        updatedAt: new Date(),
      })
    );
    const dto = mapAlert(alert);

    broadcastAlertUpdate(dto, communityId);
    if (prev && prev.severity !== dto.severity) {
      emitToCommunity(communityId, SOCKET_EVENTS.ALERT_SEVERITY, {
        id: dto.id,
        severity: dto.severity,
        title: dto.title,
      });
    }

    return jsonOk(dto);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update alert", 500);
  }
}
