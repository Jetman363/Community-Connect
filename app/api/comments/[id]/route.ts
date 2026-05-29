import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { commentSchema } from "@/lib/validations";
import { updateComment, deleteComment, mapComment } from "@/lib/api/services/comments";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const comment = await withDbTimeout(
      updateComment(id, auth.payload.sub, parsed.data.content)
    );
    if (!comment) return jsonError("Comment not found or forbidden", 404);
    return jsonOk(mapComment(comment, auth.payload.sub));
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to update comment", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;
  try {
    const ok = await withDbTimeout(deleteComment(id, auth.payload.sub));
    if (!ok) return jsonError("Comment not found or forbidden", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to delete comment", 500);
  }
}
