import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { updatePostSchema } from "@/lib/validations";
import { updatePost, deletePost, mapPostToFeed } from "@/lib/api/services/posts";
import { prisma } from "@/lib/prisma";
import { POST_INCLUDE } from "@/lib/api/services/posts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const post = await withDbTimeout(
      prisma.post.findUnique({ where: { id }, include: POST_INCLUDE })
    );
    if (!post) return jsonError("Post not found", 404);
    return jsonOk(mapPostToFeed(post));
  } catch {
    return jsonError("Failed to load post", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const post = await withDbTimeout(updatePost(id, auth.payload.sub, parsed.data));
    if (!post) return jsonError("Post not found or forbidden", 404);
    return jsonOk(mapPostToFeed(post, auth.payload.sub));
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update post", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    const ok = await withDbTimeout(deletePost(id, auth.payload.sub));
    if (!ok) return jsonError("Post not found or forbidden", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to delete post", 500);
  }
}
