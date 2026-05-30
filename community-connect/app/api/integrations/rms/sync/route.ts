import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { resolveConnectorBySlug } from "@/lib/integrations/resolve-connector";
import { logSync } from "@/lib/api/services/integrations";
import type { RmsConnectorInterface } from "@/lib/integrations/connectors/rms/rms-connector.interface";

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("connector") ?? "generic-rms";
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const communityId = req.nextUrl.searchParams.get("communityId");

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const resolved = await resolveConnectorBySlug(slug, { organizationId: orgId, communityId });
  if (!resolved) return jsonError("RMS connector not enabled", 404);

  const rms = resolved.connector as unknown as RmsConnectorInterface;
  try {
    const entityType = String(payload.entityType ?? "report");
    if (entityType === "case") {
      const rmsCase = await rms.syncCase(payload);
      await logSync(resolved.id, "INBOUND", "SUCCESS", rmsCase.caseNumber);
      return jsonOk({ case: rmsCase });
    }
    const report = await rms.syncReport(payload);
    await logSync(resolved.id, "INBOUND", "SUCCESS", report.externalId);
    return jsonOk({ report });
  } catch (err) {
    await logSync(resolved.id, "INBOUND", "FAILED", undefined, String(err));
    return jsonError("Sync failed", 500);
  }
}
