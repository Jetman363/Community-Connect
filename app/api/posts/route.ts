import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { feedQuerySchema } from "@/lib/validations";
import {
  listPosts,
  createPost,
  mapPostToFeed,
  getDefaultCommunityId,
} from "@/lib/api/services/posts";
import { getMockFeedPosts } from "@/lib/api/fallback";
import { emitToCommunity, SOCKET_EVENTS } from "@/lib/realtime/emit";
import { postSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) {
    if (process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockFeedPosts(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return auth;
  }
  const userId = auth.payload.sub;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = feedQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      req.nextUrl.searchParams.get("communityId") ??
      (userId ? await withDbTimeout(getDefaultCommunityId(userId)) : null);

    if (!communityId) {
      if (process.env.NODE_ENV === "development") {
        const items = getMockFeedPosts();
        return jsonOk({ items, nextCursor: null, hasMore: false, source: "mock" });
      }
      return jsonError("No community context", 400);
    }

    const result = await withDbTimeout(
      listPosts({
        communityId,
        userId,
        sort: parsed.data.sort,
        category: parsed.data.category,
        cursor: parsed.data.cursor,
        limit: parsed.data.limit,
      })
    );

    return jsonOk({ ...result, source: "db" });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockFeedPosts(), nextCursor: null, hasMore: false, source: "mock" });
    }
    return jsonError("Failed to load feed", 500);
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "posts-create"), 30, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      body.communityId ?? (await withDbTimeout(getDefaultCommunityId(auth.payload.sub)));
    if (!communityId) return jsonError("No community membership", 400);

    const post = await withDbTimeout(
      createPost({
        communityId,
        authorId: auth.payload.sub,
        ...parsed.data,
      })
    );

    const feedPost = mapPostToFeed(post, auth.payload.sub);
    emitToCommunity(communityId, SOCKET_EVENTS.POST_NEW, feedPost);

    return jsonOk(feedPost, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create post", 500);
  }
}
