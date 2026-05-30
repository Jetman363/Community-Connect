import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { opsAssignSchema, opsStatusSchema } from "@/lib/validations/enterprise";
import { assignOpsIncident } from "@/lib/api/services/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { emitToRooms } from "@/lib/realtime/emit";
import { SOCKET_EVENTS } from "@/lib/realtime/events";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "DISPATCHER",
    permission: PERMISSIONS.OPS_DISPATCH,
  });
  if (!("payload" in auth)) return auth;

  const action = req.nextUrl.searchParams.get("action") ?? "status";
  const body = await req.json();

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub, body.communityId);
    if (!communityId) return jsonError("No community context", 400);

    if (action === "assign") {
      const parsed = opsAssignSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid input", 400);
      const report = await withDbTimeout(
        assignOpsIncident(id, communityId, parsed.data.assigneeId)
      );
      await writeAuditLog({
        actorId: auth.payload.sub,
        action: "ops.incident.assign",
        resource: "report",
        resourceId: id,
        communityId,
        metadata: { assigneeId: parsed.data.assigneeId },
      });
      emitToRooms(
        [`ops:${communityId}`, `community:${communityId}`],
        SOCKET_EVENTS.OPS_INCIDENT_UPDATE,
        { id, action: "assign", assigneeId: parsed.data.assigneeId }
      );
      return jsonOk(report);
    }

    if (action === "escalate") {
      const report = await withDbTimeout(
        prisma.report.update({
          where: { id, communityId },
          data: { severity: "CRITICAL", status: "IN_PROGRESS" },
        })
      );
      emitToRooms([`ops:${communityId}`], SOCKET_EVENTS.OPS_INCIDENT_UPDATE, {
        id,
        action: "escalate",
      });
      return jsonOk(report);
    }

    const parsed = opsStatusSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid status", 400);
    const report = await withDbTimeout(
      prisma.report.update({
        where: { id, communityId },
        data: { status: parsed.data.status },
      })
    );
    emitToRooms([`ops:${communityId}`], SOCKET_EVENTS.OPS_INCIDENT_UPDATE, {
      id,
      status: parsed.data.status,
    });
    return jsonOk(report);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
