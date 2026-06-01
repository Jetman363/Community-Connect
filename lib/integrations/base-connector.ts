import type { ConnectorHealth } from "./types";
import type { IntegrationEvent } from "./types";

export interface ConnectorContext {
  connectorId: string;
  slug: string;
  config: Record<string, unknown>;
  organizationId?: string | null;
  communityId?: string | null;
}

/** Abstract contract — all connectors implement this; no vendor-specific types here. */
export abstract class BaseConnector {
  constructor(protected readonly ctx: ConnectorContext) {}

  abstract get slug(): string;

  /** Lightweight connectivity check */
  abstract healthCheck(): Promise<ConnectorHealth>;

  /** Optional inbound event processing */
  async handleInbound(_event: IntegrationEvent): Promise<void> {
    return;
  }

  /** Emit normalized outbound events */
  protected async publish(event: Omit<IntegrationEvent, "id" | "timestamp">): Promise<void> {
    const { getEventBroker } = await import("./event-broker");
    getEventBroker().publish({
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      connectorSlug: this.slug,
    });
  }
}

export interface ConnectorFactory {
  create(ctx: ConnectorContext): BaseConnector;
}
