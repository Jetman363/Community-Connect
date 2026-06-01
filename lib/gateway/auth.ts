import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/integrations/credential-vault";
import type { TenantScope } from "@/lib/integrations/types";

export interface GatewayAuthResult {
  ok: true;
  connectorId: string;
  organizationId: string | null;
  communityId: string | null;
  scope: TenantScope;
}

export async function authenticateGatewayRequest(
  apiKey: string | null
): Promise<GatewayAuthResult | { ok: false; error: string }> {
  if (!apiKey) {
    return { ok: false, error: "Missing API key" };
  }

  const hash = hashApiKey(apiKey);
  const hint = `gw:${hash.slice(0, 16)}`;

  const cred = await prisma.integrationCredential.findFirst({
    where: { type: "API_KEY", keyHint: hint },
    include: { connector: true },
  });

  if (!cred?.connector?.enabled) {
    return { ok: false, error: "Invalid API key" };
  }

  return {
    ok: true,
    connectorId: cred.connectorId,
    organizationId: cred.connector.organizationId,
    communityId: cred.connector.communityId,
    scope: {
      organizationId: cred.connector.organizationId,
      communityId: cred.connector.communityId,
    },
  };
}

export function extractApiKey(authHeader: string | null, queryKey: string | null): string | null {
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  if (authHeader?.startsWith("ApiKey ")) return authHeader.slice(7);
  return queryKey;
}
