import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { updateModerationCase } from "@/lib/api/services/enterprise";
import { moderationCasePatchSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { emitToRooms } from "@/lib/realtime/emit";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.MODERATION_QUEUE,
  });
  if (!("payload" in auth)) return auth;

  try {
    const c = await withDbTimeout(
      prisma.moderationCase.findUnique({
        where: { id },
        include: {
          reporter: { include: { profile: true } },
          assignedModerator: { include: { profile: true } },
        },
      })
    );
    if (!c) return jsonError("Not found", 404);
    return jsonOk(c);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "MODERATOR",
    permission: PERMISSIONS.MODERATION_QUEUE,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = moderationCasePatchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const updated = await withDbTimeout(updateModerationCase(id, parsed.data));
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "moderation.case.update",
      resource: "moderation_case",
      resourceId: id,
      communityId: updated.communityId,
      metadata: parsed.data,
    });
    if (updated.communityId) {
      emitToRooms(
        [`admin:${updated.communityId}`, `community:${updated.communityId}`],
        SOCKET_EVENTS.MODERATION_CASE_UPDATE,
        { id, status: updated.status }
      );
    }
    return jsonOk(updated);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
