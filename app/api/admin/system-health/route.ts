import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { getSystemHealth } from "@/lib/api/services/analytics";
import { PERMISSIONS } from "@/lib/permissions/permissions";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.ADMIN_SYSTEM,
  });
  if (!("payload" in auth)) return auth;

  return jsonOk(getSystemHealth());
}
