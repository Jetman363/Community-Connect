import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  authenticateGatewayRequest,
  extractApiKey,
  gatewayEventSchema,
  logGatewayAudit,
} from "@/lib/gateway";
import { rateLimitAsync, rateLimitResponse } from "@/lib/api/rate-limit";
import { clientKey } from "@/lib/api/rate-limit";
import { getEventBroker } from "@/lib/integrations/event-broker";
import { logSync } from "@/lib/api/services/integrations";

export async function POST(req: NextRequest) {
  const apiKey = extractApiKey(
    req.headers.get("authorization"),
    req.nextUrl.searchParams.get("apiKey")
  );
  const auth = await authenticateGatewayRequest(apiKey);
  if (!auth.ok) return jsonError(auth.error, 401);

  const rl = await rateLimitAsync(clientKey(req, "gateway-events"), 120, 60_000);
  if (!rl.ok) return jsonError("Rate limit exceeded", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = gatewayEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const { type, payload } = parsed.data;
  const broker = getEventBroker();
  await broker.publish({
    id: crypto.randomUUID(),
    type,
    source: "gateway",
    connectorSlug: "gateway",
    organizationId: auth.organizationId,
    communityId: parsed.data.communityId ?? auth.communityId,
    payload,
    timestamp: new Date(),
  });

  await logSync(auth.connectorId, "INBOUND", "SUCCESS", type);
  await logGatewayAudit({
    action: "gateway.events.ingest",
    connectorId: auth.connectorId,
    organizationId: auth.organizationId,
    communityId: auth.communityId,
    metadata: { type },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  const res = jsonOk({ accepted: true, type });
  Object.entries(rateLimitResponse(rl.remaining).headers).forEach(([k, v]) =>
    res.headers.set(k, v)
  );
  return res;
}
