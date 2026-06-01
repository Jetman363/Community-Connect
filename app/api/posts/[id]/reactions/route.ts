import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { reactionSchema } from "@/lib/validations";
import {
  togglePostReaction,
  removePostReaction,
  getPostReactionCounts,
} from "@/lib/api/services/reactions";
import { prisma } from "@/lib/prisma";
import { emitToCommunity, emitToUser, SOCKET_EVENTS } from "@/lib/realtime/emit";
import { createNotification } from "@/lib/api/services/notifications";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "reactions"), 60, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: postId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const post = await withDbTimeout(prisma.post.findUnique({ where: { id: postId } }));
    if (!post) return jsonError("Post not found", 404);

    const result = await withDbTimeout(
      togglePostReaction(postId, auth.payload.sub, parsed.data.type)
    );
    const counts = await getPostReactionCounts(postId);

    emitToCommunity(post.communityId, SOCKET_EVENTS.REACTION_UPDATE, {
      postId,
      counts,
      userId: auth.payload.sub,
      action: result.action,
      type: result.type,
    });

    if (result.action === "added" && post.authorId !== auth.payload.sub && parsed.data.type === "LIKE") {
      const notif = await createNotification({
        userId: post.authorId,
        type: "LIKE",
        title: "New like",
        body: "Someone liked your post",
        link: `/feed?post=${postId}`,
      });
      emitToUser(post.authorId, SOCKET_EVENTS.NOTIFICATION_NEW, notif);
    }

    return jsonOk({ ...result, counts });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to toggle reaction", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: postId } = await params;
  const type = (req.nextUrl.searchParams.get("type") ?? "LIKE") as "LIKE" | "HELPFUL" | "SUPPORT" | "ALERT_ACK";

  try {
    await withDbTimeout(removePostReaction(postId, auth.payload.sub, type));
    const counts = await getPostReactionCounts(postId);
    return jsonOk({ removed: true, counts });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to remove reaction", 500);
  }
}
