import { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/response";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { getIntegrationHealth, runConnectorHealthChecks } from "@/lib/api/services/integrations";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "DISPATCHER",
    permission: PERMISSIONS.INTEGRATIONS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  const communityId = await resolveCommunityId(req, auth.payload.sub);
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const community = communityId
    ? await prisma.community.findUnique({
        where: { id: communityId },
        select: { organizationId: true },
      })
    : null;

  const scope = {
    organizationId: orgId ?? community?.organizationId ?? null,
    communityId,
  };

  if (req.nextUrl.searchParams.get("refresh") === "true") {
    await runConnectorHealthChecks(scope);
  }

  const health = await getIntegrationHealth(scope);
  return jsonOk(health);
}
