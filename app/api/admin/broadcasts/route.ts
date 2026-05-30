import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { listBroadcasts, createBroadcast } from "@/lib/api/services/enterprise";
import { broadcastSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_BROADCAST,
  });
  if (!("payload" in auth)) return auth;

  try {
    const communityId = await resolveCommunityId(req, auth.payload.sub);
    if (!communityId) return jsonError("No community context", 400);
    const items = await withDbTimeout(listBroadcasts(communityId));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_BROADCAST,
  });
  if (!("payload" in auth)) return auth;

  const body = await req.json();
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const communityId =
      parsed.data.communityId ?? (await resolveCommunityId(req, auth.payload.sub));
    if (!communityId) return jsonError("No community context", 400);

    const broadcast = await withDbTimeout(
      createBroadcast({
        title: parsed.data.title,
        body: parsed.data.body,
        severity: parsed.data.severity,
        channels: parsed.data.channels,
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : undefined,
        status: parsed.data.scheduledAt ? "SCHEDULED" : "DRAFT",
        community: { connect: { id: communityId } },
      })
    );
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "broadcast.create",
      resource: "broadcast",
      resourceId: broadcast.id,
      communityId,
    });
    return jsonOk(broadcast, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
