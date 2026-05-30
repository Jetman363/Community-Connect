import { BaseConnector } from "../../base-connector";
import type { ConnectorHealth } from "../../types";
import type {
  CadConnectorInterface,
  CadIncident,
  CadTimelineEntry,
  CadUnitStatus,
} from "./cad-connector.interface";

const SAMPLE_INCIDENTS: CadIncident[] = [
  {
    externalId: "MOCK-CAD-001",
    title: "Suspicious activity — Oak Ave",
    description: "Caller reports unknown vehicle circling block",
    category: "crime",
    severity: "moderate",
    lat: 37.7749,
    lng: -122.4194,
    locationLabel: "Oak Ave & 3rd",
    status: "dispatched",
    units: [{ unitId: "UNIT-12", status: "en_route", updatedAt: new Date() }],
    timeline: [
      {
        id: "tl-1",
        message: "Call received",
        timestamp: new Date(Date.now() - 120_000),
      },
      {
        id: "tl-2",
        message: "Unit 12 dispatched",
        timestamp: new Date(Date.now() - 60_000),
        actor: "dispatch",
      },
    ],
  },
  {
    externalId: "MOCK-CAD-002",
    title: "Medical assist — Community Center",
    description: "Fall injury, conscious and breathing",
    category: "medical",
    severity: "high",
    lat: 37.773,
    lng: -122.42,
    locationLabel: "Community Center",
    status: "on_scene",
    units: [{ unitId: "EMS-3", status: "on_scene", updatedAt: new Date() }],
  },
];

/** Mock CAD for development — emits sample incidents when enabled */
export class MockCadConnector extends BaseConnector implements CadConnectorInterface {
  private incidents = [...SAMPLE_INCIDENTS];

  get slug(): string {
    return "mock-cad";
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: "HEALTHY",
      lastCheck: new Date(),
      message: "Mock CAD active",
      metrics: { incidentCount: this.incidents.length },
    };
  }

  async ingestIncident(payload: Record<string, unknown>): Promise<CadIncident> {
    const incident: CadIncident = {
      externalId: String(payload.externalId ?? `MOCK-${Date.now()}`),
      title: String(payload.title ?? "Mock incident"),
      description: String(payload.description ?? ""),
      category: String(payload.category ?? "other"),
      severity: String(payload.severity ?? "moderate"),
      lat: typeof payload.lat === "number" ? payload.lat : 37.774,
      lng: typeof payload.lng === "number" ? payload.lng : -122.42,
      status: "active",
    };
    this.incidents.unshift(incident);
    await this.publish({
      type: "incident.created",
      source: "mock-cad",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: incident,
    });
    return incident;
  }

  async getUnitStatus(): Promise<CadUnitStatus[]> {
    return this.incidents.flatMap((i) => i.units ?? []);
  }

  async dispatchNotification(incidentId: string, message: string): Promise<void> {
    await this.publish({
      type: "dispatch.notification",
      source: "mock-cad",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: { incidentId, message },
    });
  }

  async getTimeline(incidentId: string): Promise<CadTimelineEntry[]> {
    const inc = this.incidents.find((i) => i.externalId === incidentId);
    return inc?.timeline ?? [];
  }

  async listIncidents(): Promise<CadIncident[]> {
    return this.incidents;
  }

  /** Emit a rotating sample incident for testing */
  async emitSampleIncident(): Promise<CadIncident> {
    const sample = SAMPLE_INCIDENTS[Math.floor(Math.random() * SAMPLE_INCIDENTS.length)];
    const copy = { ...sample, externalId: `${sample.externalId}-${Date.now()}` };
    this.incidents.unshift(copy);
    await this.publish({
      type: "incident.created",
      source: "mock-cad",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: copy,
    });
    return copy;
  }
}
