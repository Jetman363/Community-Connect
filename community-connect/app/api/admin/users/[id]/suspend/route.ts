import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { suspendUser } from "@/lib/api/services/enterprise";
import { suspendUserSchema } from "@/lib/validations/enterprise";
import { writeAuditLog } from "@/lib/api/services/audit";
import { rateLimit, clientKey } from "@/lib/api/rate-limit";
import { PERMISSIONS } from "@/lib/permissions/permissions";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: userId } = await params;
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.USERS_SUSPEND,
  });
  if (!("payload" in auth)) return auth;

  const rl = rateLimit(clientKey(req, "user-suspend"), 10, 60_000);
  if (!rl.ok) return jsonError("Too many requests", 429);

  const body = await req.json();
  const parsed = suspendUserSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());

  try {
    const suspension = await withDbTimeout(
      suspendUser({
        userId,
        issuedById: auth.payload.sub,
        reason: parsed.data.reason,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        communityId: parsed.data.communityId,
      })
    );
    await writeAuditLog({
      actorId: auth.payload.sub,
      action: "user.suspend",
      resource: "user",
      resourceId: userId,
      communityId: parsed.data.communityId,
      metadata: { reason: parsed.data.reason },
    });
    return jsonOk(suspension, 201);
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Database unavailable", 503);
    return jsonError("Failed", 500);
  }
}
