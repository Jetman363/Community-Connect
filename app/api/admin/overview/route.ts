import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { withDbTimeout, isDbUnavailable } from "@/lib/api/db";
import { enterpriseAuth, handleDbError } from "@/lib/api/handlers/enterprise";
import { getPlatformOverview } from "@/lib/api/services/analytics";
import { getMockPlatformOverview } from "@/lib/api/fallback-enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_ANALYTICS,
  });
  if (!("payload" in auth)) return auth;

  try {
    const overview = await withDbTimeout(getPlatformOverview());
    return jsonOk(overview);
  } catch (err) {
    const handled = handleDbError(err);
    if (!handled && isDbUnavailable(err)) {
      return jsonOk(getMockPlatformOverview());
    }
    return handled ?? jsonError("Failed", 500);
  }
}
