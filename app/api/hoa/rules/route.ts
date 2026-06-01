import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { listCommunityRules } from "@/lib/api/services/enterprise";
import { z } from "zod";
import { canManageHOA } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

const ruleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default("general"),
});

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listCommunityRules(communityId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, "HOA_MANAGER");
  if (!("payload" in auth)) return auth;
  if (!canManageHOA(auth.payload.role)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const item = await withDbTimeout(
      prisma.communityRule.create({ data: { communityId, ...parsed.data } })
    );
    return jsonOk(item, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
