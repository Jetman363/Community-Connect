import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireAuth } from "@/lib/api-auth";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { inviteSchema } from "@/lib/validations/enterprise";
import { createCommunityInvite } from "@/lib/api/services/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { hasMinRole } from "@/lib/permissions/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: communityId } = await params;
  const auth = requireAuth(req, "MODERATOR");
  if (!("payload" in auth)) return auth;
  if (!hasMinRole(auth.payload.role, "MODERATOR")) return jsonError("Forbidden", 403);

  const rl = rateLimit(clientKey(req, "community-invite"), 20, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const invite = await withDbTimeout(
      createCommunityInvite({
        communityId,
        email: parsed.data.email,
        role: parsed.data.role,
        invitedById: auth.payload.sub,
      })
    );
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "community.invite",
      resource: "community_invite",
      resourceId: invite.id,
      communityId,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    });
    return jsonOk({ id: invite.id, token: invite.token, expiresAt: invite.expiresAt }, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
