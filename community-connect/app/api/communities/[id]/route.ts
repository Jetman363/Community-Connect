import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { communityPatchSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { canAdmin } from "@/lib/permissions/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req);
  if (!("payload" in auth)) return auth;

  try {
    const community = await withDbTimeout(
      prisma.community.findUnique({
        where: { id },
        include: { organization: true, _count: { select: { members: true } } },
      })
    );
    if (!community) return jsonError("Not found", 404);
    return jsonOk(community);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req, "ADMIN");
  if (!("payload" in auth)) return auth;
  if (!canAdmin(auth.payload.role)) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = communityPatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const data: Prisma.CommunityUpdateInput = {
      ...parsed.data,
      brandingColors: parsed.data.brandingColors as Prisma.InputJsonValue | undefined,
      settings: parsed.data.settings as Prisma.InputJsonValue | undefined,
    };
    const community = await withDbTimeout(prisma.community.update({ where: { id }, data }));
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "community.update",
      resource: "community",
      resourceId: id,
      communityId: id,
      metadata: data as Prisma.InputJsonValue,
    });
    return jsonOk(community);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
