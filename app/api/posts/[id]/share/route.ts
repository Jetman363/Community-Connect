import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { repostPost, mapPostToFeed, getDefaultCommunityId } from "@/lib/api/services/posts";
import { emitToCommunity, SOCKET_EVENTS } from "@/lib/realtime/emit";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const rl = rateLimit(clientKey(req, "posts-share"), 20, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const { id } = await params;

  try {
    const communityId = await withDbTimeout(getDefaultCommunityId(auth.payload.sub));
    if (!communityId) return jsonError("No community membership", 400);

    const repost = await withDbTimeout(repostPost(id, auth.payload.sub, communityId));
    if (!repost) return jsonError("Original post not found", 404);

    const feedPost = mapPostToFeed(repost, auth.payload.sub);
    emitToCommunity(communityId, SOCKET_EVENTS.POST_NEW, feedPost);
    return jsonOk(feedPost, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to share post", 500);
  }
}
