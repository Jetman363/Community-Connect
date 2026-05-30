import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { communityCreateSchema } from "@/lib/validations/enterprise";
import {
  listCommunitiesForUser,
  createCommunity,
} from "@/lib/api/services/enterprise";
import { getMockCommunities } from "@/lib/api/fallback-enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { canAdmin } from "@/lib/permissions/rbac";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listCommunitiesForUser(auth.payload.sub));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk({ items: getMockCommunities(), source: "mock" });
    }
    return jsonError("Failed to load communities", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, "ADMIN");
  if (!("payload" in auth)) return auth;
  if (!canAdmin(auth.payload.role)) return jsonError("Forbidden", 403);

  const rl = rateLimit(clientKey(req, "communities-create"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const body = await req.json();
  const parsed = communityCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const community = await withDbTimeout(createCommunity(parsed.data));
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "community.create",
      resource: "community",
      resourceId: community.id,
      metadata: { slug: community.slug },
    });
    return jsonOk(community, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed to create community", 500);
  }
}
