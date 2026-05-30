import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { searchAuditLogs } from "@/lib/api/services/audit";
import { auditQuerySchema } from "@/lib/validations/enterprise";
import { getMockAuditLogs } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_AUDIT,
  });
  if (!("payload" in auth)) return auth;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = auditQuerySchema.safeParse(params);
  if (!parsed.success) return jsonError("Invalid query", 400, parsed.error.flatten());

  try {
    const communityId =
      parsed.data.communityId ?? (await resolveCommunityId(req, auth.payload.sub));
    const result = await withDbTimeout(
      searchAuditLogs({
        communityId: communityId ?? undefined,
        action: parsed.data.action,
        resource: parsed.data.resource,
        actorId: parsed.data.actorId,
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
        page: parsed.data.page,
        limit: parsed.data.limit,
      })
    );
    return jsonOk(result);
  } catch (err) {
    if (isDbUnavailable(err) && process.env.NODE_ENV === "development") {
      return jsonOk(getMockAuditLogs());
    }
    return jsonError("Failed", 500);
  }
}
