import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { listCommunityMembers, updateMemberRole } from "@/lib/api/services/enterprise";
import { memberRolePatchSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { hasMinRole } from "@/lib/permissions/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = requireAuth(req, "MODERATOR");
  if (!("payload" in auth)) return auth;

  try {
    const items = await withDbTimeout(listCommunityMembers(id));
    return jsonOk({ items });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: communityId } = await params;
  const auth = requireAuth(req, "ADMIN");
  if (!("payload" in auth)) return auth;
  if (!hasMinRole(auth.payload.role, "ADMIN")) return jsonError("Forbidden", 403);

  const body = await req.json();
  const userId = body.userId as string | undefined;
  const parsed = memberRolePatchSchema.safeParse(body);
  if (!userId || !parsed.success) {
    return jsonError("userId and role required", 400, parsed.success ? undefined : parsed.error.flatten());
  }

  try {
    const member = await withDbTimeout(
      updateMemberRole(communityId, userId, parsed.data.role)
    );
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "member.role.update",
      resource: "community_member",
      resourceId: member.id,
      communityId,
      metadata: { userId, role: parsed.data.role },
    });
    return jsonOk(member);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
