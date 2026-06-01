import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { enterpriseAuth, resolveCommunityId } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { listConnectorsForTenant, CONNECTOR_CATALOG } from "@/lib/integrations/registry";
import {
  enableConnector,
  disableConnector,
  patchConnectorConfig,
} from "@/lib/api/services/integrations";
import { prisma } from "@/lib/prisma";

async function tenantScope(req: NextRequest, userId: string) {
  const communityId = await resolveCommunityId(req, userId);
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const community = communityId
    ? await prisma.community.findUnique({
        where: { id: communityId },
        select: { organizationId: true },
      })
    : null;
  return {
    organizationId: orgId ?? community?.organizationId ?? null,
    communityId,
  };
}

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.INTEGRATIONS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  const scope = await tenantScope(req, auth.payload.sub);
  const connectors = await listConnectorsForTenant(scope);
  return jsonOk({ items: connectors, catalog: CONNECTOR_CATALOG });
}

export async function PATCH(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.INTEGRATIONS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const scope = await tenantScope(req, auth.payload.sub);
  let body: { id?: string; action?: string; config?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (!body.id) return jsonError("Missing connector id", 400);

  if (body.action === "enable") {
    const updated = await enableConnector(body.id, auth.payload.sub, scope);
    return jsonOk(updated);
  }
  if (body.action === "disable") {
    const updated = await disableConnector(body.id, auth.payload.sub, scope);
    return jsonOk(updated);
  }
  if (body.config) {
    const updated = await patchConnectorConfig(body.id, body.config, auth.payload.sub, scope);
    return jsonOk(updated);
  }

  return jsonError("Unknown action", 400);
}
