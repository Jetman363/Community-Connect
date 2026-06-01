import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { listMaintenanceRequests } from "@/lib/api/services/enterprise";
import { maintenanceRequestSchema } from "@/lib/validations/enterprise";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const mine = req.nextUrl.searchParams.get("mine") === "true";
    const items = await withDbTimeout(
      listMaintenanceRequests(communityId, mine ? auth.payload.sub : undefined)
    );
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = maintenanceRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const item = await withDbTimeout(
      prisma.maintenanceRequest.create({
        data: {
          communityId,
          requesterId: auth.payload.sub,
          ...parsed.data,
        },
      })
    );
    return jsonOk(item, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
