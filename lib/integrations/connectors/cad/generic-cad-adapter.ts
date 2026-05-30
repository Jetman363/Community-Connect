import { BaseConnector } from "../../base-connector";
import type { ConnectorHealth } from "../../types";
import type {
  CadConnectorInterface,
  CadIncident,
  CadTimelineEntry,
  CadUnitStatus,
} from "./cad-connector.interface";
import { normalizeCadWebhook } from "./cad-normalizer";

/** Generic vendor-agnostic CAD adapter — maps webhook payloads via config. */
export class GenericCadAdapter extends BaseConnector implements CadConnectorInterface {
  get slug(): string {
    return "generic-cad";
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: this.ctx.config.endpoint ? "HEALTHY" : "DEGRADED",
      lastCheck: new Date(),
      message: this.ctx.config.endpoint ? "Endpoint configured" : "Missing endpoint in config",
    };
  }

  async ingestIncident(payload: Record<string, unknown>): Promise<CadIncident> {
    const incident = normalizeCadWebhook(payload);
    await this.publish({
      type: "incident.created",
      source: "generic-cad",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: incident,
    });
    return incident;
  }

  async getUnitStatus(): Promise<CadUnitStatus[]> {
    return [];
  }

  async dispatchNotification(_incidentId: string, message: string): Promise<void> {
    await this.publish({
      type: "dispatch.notification",
      source: "generic-cad",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: { message },
    });
  }

  async getTimeline(_incidentId: string): Promise<CadTimelineEntry[]> {
    return [];
  }
}
