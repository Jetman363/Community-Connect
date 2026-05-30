import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import { authenticateGatewayRequest, extractApiKey } from "@/lib/gateway";
import { runConnectorHealthChecks } from "@/lib/api/services/integrations";

export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(
    req.headers.get("authorization"),
    req.nextUrl.searchParams.get("apiKey")
  );
  const auth = await authenticateGatewayRequest(apiKey);
  if (!auth.ok) return jsonError(auth.error, 401);

  const checks = await runConnectorHealthChecks(auth.scope);
  return jsonOk({
    status: checks.every((c) => c.status === "HEALTHY") ? "healthy" : "degraded",
    connectors: checks,
    version: "v1",
  });
}
