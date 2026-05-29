import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { commentSchema } from "@/lib/validations";
import { listComments, createComment, mapComment } from "@/lib/api/services/comments";
import { createNotification } from "@/lib/api/services/notifications";
import { prisma } from "@/lib/prisma";
import { emitToCommunity, emitToUser, SOCKET_EVENTS } from "@/lib/realtime/emit";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  const userId = "payload" in auth ? auth.payload.sub : undefined;
  const { id: postId } = await params;
  const parentId = req.nextUrl.searchParams.get("parentId");

  try {
    const comments = await withDbTimeout(
      listComments(postId, userId, parentId === "null" ? null : parentId ?? null)
    );
    return jsonOk({ items: comments });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load comments", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "comments-create"), 40, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: postId } = await params;
  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const post = await withDbTimeout(prisma.post.findUnique({ where: { id: postId } }));
    if (!post) return jsonError("Post not found", 404);

    const comment = await withDbTimeout(
      createComment({
        postId,
        authorId: auth.payload.sub,
        content: parsed.data.content,
        parentId: parsed.data.parentId,
      })
    );

    const mapped = mapComment(comment, auth.payload.sub);
    emitToCommunity(post.communityId, SOCKET_EVENTS.COMMENT_NEW, { postId, comment: mapped });

    if (post.authorId !== auth.payload.sub) {
      const notif = await createNotification({
        userId: post.authorId,
        type: parsed.data.parentId ? "REPLY" : "COMMENT",
        title: parsed.data.parentId ? "New reply" : "New comment",
        body: parsed.data.content.slice(0, 120),
        link: `/feed?post=${postId}`,
      });
      emitToUser(post.authorId, SOCKET_EVENTS.NOTIFICATION_NEW, notif);
    }

    return jsonOk(mapped, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create comment", 500);
  }
}
