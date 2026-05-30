import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/prisma";

/** Agency configuration portal API — config versioning stub */
export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.INTEGRATIONS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return jsonError("organizationId required", 400);

  const [org, branding, connectors, automations] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.tenantBranding.findUnique({ where: { organizationId: orgId } }),
    prisma.integrationConnector.findMany({ where: { organizationId: orgId } }),
    prisma.workflowAutomation.findMany({ where: { organizationId: orgId } }),
  ]);

  return jsonOk({
    version: 1,
    revision: org?.updatedAt.toISOString(),
    organization: org,
    branding,
    integrations: { count: connectors.length, enabled: connectors.filter((c) => c.enabled).length },
    workflows: { count: automations.length, enabled: automations.filter((a) => a.enabled).length },
    retention: await prisma.auditLogRetention.findFirst({ where: { organizationId: orgId } }),
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "ADMIN",
    permission: PERMISSIONS.INTEGRATIONS_MANAGE,
  });
  if (!("payload" in auth)) return auth;

  const orgId = req.nextUrl.searchParams.get("organizationId");
  if (!orgId) return jsonError("organizationId required", 400);

  let body: { settings?: Record<string, unknown>; featureFlags?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  if (body.settings) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        settings: { ...((org?.settings as object) ?? {}), ...body.settings, configVersion: Date.now() },
      },
    });
  }

  if (body.featureFlags) {
    await prisma.tenantBranding.upsert({
      where: { organizationId: orgId },
      update: { featureFlags: body.featureFlags },
      create: { organizationId: orgId, featureFlags: body.featureFlags },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.payload.sub,
      action: "agency.config.update",
      resource: "organization",
      resourceId: orgId,
      organizationId: orgId,
      metadata: { keys: Object.keys(body) },
    },
  });

  return jsonOk({ updated: true, version: 1 });
}
