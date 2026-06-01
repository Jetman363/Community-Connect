import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { enterpriseAuth } from "@/lib/api/handlers/enterprise";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { resolveConnectorBySlug } from "@/lib/integrations/resolve-connector";
import { logSync } from "@/lib/api/services/integrations";
import { MockCadConnector } from "@/lib/integrations/connectors/cad/mock-cad-connector";
import { GenericCadAdapter } from "@/lib/integrations/connectors/cad/generic-cad-adapter";
import type { CadConnectorInterface } from "@/lib/integrations/connectors/cad/cad-connector.interface";
import { verifyWebhookSignature } from "@/lib/integrations/credential-vault";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const slug = req.nextUrl.searchParams.get("connector") ?? "generic-cad";

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const orgId = req.nextUrl.searchParams.get("organizationId");
  const communityId = req.nextUrl.searchParams.get("communityId");
  const scope = { organizationId: orgId, communityId };

  const secret = process.env.CAD_WEBHOOK_SECRET ?? "dev-cad-secret";
  if (process.env.NODE_ENV === "production" && !verifyWebhookSignature(secret, body, signature)) {
    return jsonError("Invalid signature", 401);
  }

  const resolved = await resolveConnectorBySlug(slug, scope);
  if (!resolved) {
    return jsonError("Connector not enabled", 404);
  }

  const cad = resolved.connector as unknown as CadConnectorInterface;
  try {
    const incident = await cad.ingestIncident(payload);
    await logSync(resolved.id, "INBOUND", "SUCCESS", incident.externalId);
    return jsonOk({ incident });
  } catch (err) {
    await logSync(resolved.id, "INBOUND", "FAILED", undefined, String(err));
    return jsonError("Ingest failed", 500);
  }
}

export async function GET(req: NextRequest) {
  const auth = await enterpriseAuth(req, {
    minRole: "DISPATCHER",
    permission: PERMISSIONS.OPS_VIEW,
  });
  if (!("payload" in auth)) return auth;

  const orgId = req.nextUrl.searchParams.get("organizationId");
  const communityId = req.nextUrl.searchParams.get("communityId");
  const slug = req.nextUrl.searchParams.get("connector") ?? "mock-cad";

  const resolved = await resolveConnectorBySlug(slug, { organizationId: orgId, communityId });
  if (!resolved) {
    return jsonOk({ items: [], message: "CAD connector not enabled" });
  }

  if (resolved.connector instanceof MockCadConnector) {
    const items = await resolved.connector.listIncidents();
    return jsonOk({ items, source: "mock-cad" });
  }

  if (resolved.connector instanceof GenericCadAdapter) {
    return jsonOk({ items: [], source: "generic-cad" });
  }

  const row = await prisma.integrationSyncLog.findMany({
    where: { connectorId: resolved.id, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return jsonOk({ items: row, source: slug });
}
