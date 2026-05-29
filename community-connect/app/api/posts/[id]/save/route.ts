import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { savePost, unsavePost } from "@/lib/api/services/saved";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const auth = requireAuth(_req);
  if (!("payload" in auth)) return auth;

  const { id: postId } = await params;
  try {
    await withDbTimeout(savePost(auth.payload.sub, postId));
    return jsonOk({ saved: true }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to save post", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = requireAuth(_req);
  if (!("payload" in auth)) return auth;

  const { id: postId } = await params;
  try {
    await withDbTimeout(unsavePost(auth.payload.sub, postId));
    return jsonOk({ saved: false });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to unsave post", 500);
  }
}
