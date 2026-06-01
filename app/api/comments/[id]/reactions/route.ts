import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { reactionSchema } from "@/lib/validations";
import { toggleCommentReaction, removeCommentReaction } from "@/lib/api/services/reactions";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "reactions"), 60, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: commentId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const result = await withDbTimeout(
      toggleCommentReaction(commentId, auth.payload.sub, parsed.data.type)
    );
    return jsonOk(result);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to toggle reaction", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id: commentId } = await params;
  const type = (req.nextUrl.searchParams.get("type") ?? "LIKE") as "LIKE" | "HELPFUL" | "SUPPORT" | "ALERT_ACK";

  try {
    await withDbTimeout(removeCommentReaction(commentId, auth.payload.sub, type));
    return jsonOk({ removed: true });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to remove reaction", 500);
  }
}
