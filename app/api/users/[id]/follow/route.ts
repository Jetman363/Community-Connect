import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { follow, unfollow, getFollowers, getFollowing } from "@/lib/api/services/follows";
import { createNotification } from "@/lib/api/services/notifications";
import { emitToUser, SOCKET_EVENTS } from "@/lib/realtime/emit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: targetId } = await params;
  if (targetId === auth.payload.sub) return jsonError("Cannot follow yourself", 400);

  const body = await req.json().catch(() => ({}));
  const targetType = (body.targetType ?? "USER") as "USER" | "BUSINESS" | "COMMUNITY" | "TOPIC";

  try {
    await withDbTimeout(follow(auth.payload.sub, targetType, targetId));

    if (targetType === "USER") {
      const notif = await createNotification({
        userId: targetId,
        type: "FOLLOW",
        title: "New follower",
        body: "Someone started following you",
        link: `/profile`,
      });
      emitToUser(targetId, SOCKET_EVENTS.NOTIFICATION_NEW, notif);
    }

    return jsonOk({ following: true }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to follow", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: targetId } = await params;
  const targetType = (req.nextUrl.searchParams.get("targetType") ?? "USER") as
    | "USER"
    | "BUSINESS"
    | "COMMUNITY"
    | "TOPIC";

  try {
    await withDbTimeout(unfollow(auth.payload.sub, targetType, targetId));
    return jsonOk({ following: false });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to unfollow", 500);
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id: userId } = await params;
  const list = req.nextUrl.searchParams.get("list") ?? "followers";

  try {
    if (list === "following") {
      const items = await withDbTimeout(getFollowing(userId));
      return jsonOk({ items });
    }
    const items = await withDbTimeout(getFollowers("USER", userId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load follow list", 500);
  }
}
