import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { resolveConnectorBySlug } from "@/lib/integrations/resolve-connector";
import { logSync } from "@/lib/api/services/integrations";
import { MockTrafficConnector } from "@/lib/integrations/connectors/smart-city/mock-traffic-connector";
import { MockWeatherConnector } from "@/lib/integrations/connectors/smart-city/mock-weather-connector";

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("connector") ?? "mock-traffic";
  const orgId = req.nextUrl.searchParams.get("organizationId");
  const communityId = req.nextUrl.searchParams.get("communityId");

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const resolved = await resolveConnectorBySlug(slug, { organizationId: orgId, communityId });
  if (!resolved) return jsonError("Smart city connector not enabled", 404);

  try {
    if (resolved.connector instanceof MockTrafficConnector) {
      await resolved.connector.ingestEvent(payload);
    } else if (resolved.connector instanceof MockWeatherConnector) {
      await resolved.connector.ingestEvent(payload);
    } else {
      await logSync(resolved.id, "INBOUND", "FAILED", undefined, "Unsupported connector");
      return jsonError("Unsupported connector", 400);
    }
    await logSync(resolved.id, "INBOUND", "SUCCESS", String(payload.type ?? slug));
    return jsonOk({ accepted: true });
  } catch (err) {
    await logSync(resolved.id, "INBOUND", "FAILED", undefined, String(err));
    return jsonError("Event ingest failed", 500);
  }
}
