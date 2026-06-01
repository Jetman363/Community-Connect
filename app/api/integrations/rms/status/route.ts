import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { resolveConnectorBySlug } from "@/lib/integrations/resolve-connector";
import { MockRmsConnector } from "@/lib/integrations/connectors/rms/mock-rms-connector";
import type { RmsConnectorInterface } from "@/lib/integrations/connectors/rms/rms-connector.interface";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "DISPATCHER",
    permission: PERMISSIONS.INTEGRATIONS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  const slug = req.nextUrl.searchParams.get("connector") ?? "mock-rms";
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const communityId = req.nextUrl.searchParams.get("communityId");

  const resolved = await resolveConnectorBySlug(slug, { organizationId: orgId, communityId });
  if (!resolved) {
    return jsonOk({ connected: false, message: "RMS connector not enabled" });
  }

  const rms = resolved.connector as unknown as RmsConnectorInterface;
  const status = await rms.getStatus();

  if (resolved.connector instanceof MockRmsConnector) {
    return jsonOk({
      ...status,
      reports: resolved.connector.listReports(),
      source: "mock-rms",
    });
  }

  return jsonOk({ ...status, source: slug });
}
