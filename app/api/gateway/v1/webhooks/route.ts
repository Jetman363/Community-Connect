import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/api/response";
import {
  authenticateGatewayRequest,
  extractApiKey,
  gatewayWebhookRegisterSchema,
  logGatewayAudit,
} from "@/lib/gateway";
import { prisma } from "@/lib/prisma";
import { registerWebhook } from "@/lib/integrations/webhook-manager";
import { hashWebhookSecret } from "@/lib/integrations/credential-vault";

export async function POST(req: NextRequest) {
  const apiKey = extractApiKey(
    req.headers.get("authorization"),
    req.nextUrl.searchParams.get("apiKey")
  );
  const auth = await authenticateGatewayRequest(apiKey);
  if (!auth.ok) return jsonError(auth.error, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = gatewayWebhookRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten());
  }

  const connector = await prisma.integrationConnector.findFirst({
    where: {
      slug: parsed.data.connectorSlug,
      enabled: true,
      organizationId: auth.organizationId ?? undefined,
    },
  });

  if (!connector) return jsonError("Connector not found", 404);

  const secret = crypto.randomUUID();
  const { id } = await registerWebhook(connector.id, parsed.data.url, parsed.data.events, secret);

  await logGatewayAudit({
    action: "gateway.webhooks.register",
    connectorId: connector.id,
    organizationId: auth.organizationId,
    metadata: { url: parsed.data.url, webhookId: id },
  });

  return jsonOk({
    id,
    secretHint: hashWebhookSecret(secret).slice(0, 8),
    message: "Store secret securely — shown once in dev responses only",
    ...(process.env.NODE_ENV === "development" ? { secret } : {}),
  });
}

export async function GET(req: NextRequest) {
  const apiKey = extractApiKey(
    req.headers.get("authorization"),
    req.nextUrl.searchParams.get("apiKey")
  );
  const auth = await authenticateGatewayRequest(apiKey);
  if (!auth.ok) return jsonError(auth.error, 401);

  const webhooks = await prisma.integrationWebhook.findMany({
    where: { connector: { organizationId: auth.organizationId ?? undefined } },
    select: { id: true, url: true, events: true, active: true, connectorId: true },
  });

  return jsonOk({ items: webhooks });
}
