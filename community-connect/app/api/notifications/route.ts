import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/services/notifications";
import { getMockNotifications } from "@/lib/api/fallback";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  try {
    const result = await withDbTimeout(listNotifications(auth.payload.sub, cursor));
    return jsonOk(result);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      const items = getMockNotifications();
      return jsonOk({
        items,
        nextCursor: null,
        hasMore: false,
        unreadCount: items.filter((n) => !n.read).length,
        source: "mock",
      });
    }
    return jsonError("Failed to load notifications", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json().catch(() => ({}));

  try {
    if (body.all === true) {
      await withDbTimeout(markAllNotificationsRead(auth.payload.sub));
      return jsonOk({ read: true, all: true });
    }

    if (typeof body.id === "string") {
      await withDbTimeout(markNotificationRead(body.id, auth.payload.sub));
      return jsonOk({ read: true, id: body.id });
    }

    return jsonError("Provide id or all:true", 400);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update notification", 500);
  }
}
