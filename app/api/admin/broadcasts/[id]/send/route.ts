import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { sendBroadcast } from "@/lib/api/services/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { emitToCommunity } from "@/lib/realtime/emit";
import { SOCKET_EVENTS } from "@/lib/realtime/events";
type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_BROADCAST,
  });
  if (!("payload" in auth)) return auth;

  try {
    const broadcast = await withDbTimeout(sendBroadcast(id));
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "broadcast.send",
      resource: "broadcast",
      resourceId: id,
      communityId: broadcast.communityId,
    });
    emitToCommunity(broadcast.communityId, SOCKET_EVENTS.BROADCAST_SENT, {
      id: broadcast.id,
      title: broadcast.title,
      severity: broadcast.severity,
    });
    return jsonOk(broadcast);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
