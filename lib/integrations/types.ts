import type { ConnectorCategory, ConnectorHealthStatus } from "@prisma/client";

export { ConnectorCategory };

export interface ConnectorDefinition {
  slug: string;
  name: string;
  category: ConnectorCategory;
  description?: string;
  /** Factory key resolved by registry — never a vendor SDK class name */
  adapterKey: string;
  defaultConfig?: Record<string, unknown>;
  supportedEvents?: string[];
}

export interface IntegrationEvent<T = unknown> {
  id: string;
  type: string;
  source: string;
  connectorSlug: string;
  organizationId?: string | null;
  communityId?: string | null;
  payload: T;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ConnectorHealth {
  status: ConnectorHealthStatus;
  lastCheck: Date;
  message?: string;
  metrics?: Record<string, unknown>;
}

export interface CredentialRef {
  connectorId: string;
  type: "API_KEY" | "OAUTH" | "WEBHOOK_SECRET" | "BASIC";
  /** Last 4 chars or label — safe to log */
  hint?: string;
}

export interface TenantScope {
  organizationId?: string | null;
  communityId?: string | null;
}

export interface ConnectorInstance {
  id: string;
  slug: string;
  enabled: boolean;
  config: Record<string, unknown>;
  organizationId?: string | null;
  communityId?: string | null;
}

export type EventHandler = (event: IntegrationEvent) => void | Promise<void>;
