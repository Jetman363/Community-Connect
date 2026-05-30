import { BaseConnector } from "../../base-connector";
import type { ConnectorHealth } from "../../types";

export abstract class SmartCityConnector extends BaseConnector {
  abstract get eventTypes(): string[];

  async healthCheck(): Promise<ConnectorHealth> {
    return { status: "HEALTHY", lastCheck: new Date() };
  }

  protected async emitEvent(type: string, payload: Record<string, unknown>): Promise<void> {
    await this.publish({
      type,
      source: this.slug,
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload,
    });
  }
}

export const SMART_CITY_TEMPLATES = {
  traffic: ["traffic.congestion", "traffic.incident", "traffic.signal"],
  weather: ["weather.alert", "weather.forecast"],
  utilities: ["utility.outage", "utility.restored"],
  sensors: ["sensor.reading", "sensor.threshold"],
} as const;
