import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { getActiveCommunityId } from "@/lib/api/community-context";
import { listViolationReports } from "@/lib/api/services/enterprise";
import { violationReportSchema } from "@/lib/validations/enterprise";
import { canManageHOA } from "@/lib/permissions/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, "HOA_MANAGER");
  if (!("payload" in auth)) return auth;
  if (!canManageHOA(auth.payload.role)) return jsonError("Forbidden", 403);

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listViolationReports(communityId));
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
  const parsed = violationReportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId = await withDbTimeout(getActiveCommunityId(auth.payload.sub, req));
    if (!communityId) return jsonError("No community context", 400);
    const item = await withDbTimeout(
      prisma.violationReport.create({
        data: {
          communityId,
          reporterId: auth.payload.sub,
          description: parsed.data.description,
          address: parsed.data.address,
          anonymous: parsed.data.anonymous,
        },
      })
    );
    return jsonOk(item, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
