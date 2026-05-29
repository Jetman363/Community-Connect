import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { savePost, unsavePost, listSavedPosts } from "@/lib/api/services/saved";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listSavedPosts(auth.payload.sub));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to load saved posts", 500);
  }
}
