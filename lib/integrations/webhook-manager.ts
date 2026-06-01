import { prisma } from "@/lib/prisma";
import { hashWebhookSecret, verifyWebhookSignature } from "./credential-vault";
import type { IntegrationEvent } from "./types";
import { getEventBroker } from "./event-broker";

export async function registerWebhook(
  connectorId: string,
  url: string,
  events: string[],
  secret?: string
): Promise<{ id: string }> {
  const row = await prisma.integrationWebhook.create({
    data: {
      connectorId,
      url,
      events,
      secretHash: secret ? hashWebhookSecret(secret) : null,
    },
  });
  return { id: row.id };
}

export async function verifyInboundWebhook(
  connectorId: string,
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  return verifyWebhookSignature(secret, body, signature);
}

export async function dispatchOutboundWebhooks(event: IntegrationEvent): Promise<void> {
  const webhooks = await prisma.integrationWebhook.findMany({
    where: {
      active: true,
      OR: [{ events: { has: event.type } }, { events: { isEmpty: true } }],
      connector: {
        slug: event.connectorSlug,
        enabled: true,
        ...(event.organizationId != null ? { organizationId: event.organizationId } : {}),
        ...(event.communityId != null ? { communityId: event.communityId } : {}),
      },
    },
  });

  await Promise.all(
    webhooks.map(async (wh) => {
      try {
        await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
      } catch {
        // Outbound webhook failures are logged via sync log in production paths
      }
    })
  );
}

export async function processInboundWebhook(
  connectorId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const connector = await prisma.integrationConnector.findUnique({
    where: { id: connectorId },
  });
  if (!connector?.enabled) return;

  const event: IntegrationEvent = {
    id: crypto.randomUUID(),
    type: eventType,
    source: "webhook",
    connectorSlug: connector.slug,
    organizationId: connector.organizationId,
    communityId: connector.communityId,
    payload,
    timestamp: new Date(),
  };

  const broker = getEventBroker();
  await broker.publish(event);
  await broker.dispatchWebhooks(event);
}
