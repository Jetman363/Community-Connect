import { SmartCityConnector } from "./smart-city-connector";

export class MockTrafficConnector extends SmartCityConnector {
  get slug(): string {
    return "mock-traffic";
  }

  get eventTypes(): string[] {
    return ["traffic.congestion", "traffic.incident"];
  }

  async ingestEvent(payload: Record<string, unknown>): Promise<void> {
    await this.emitEvent("traffic.incident", {
      road: payload.road ?? "Oak Ave",
      severity: payload.severity ?? "moderate",
      description: payload.description ?? "Congestion detected",
      lat: payload.lat ?? 37.774,
      lng: payload.lng ?? -122.42,
    });
  }

  async emitSample(): Promise<void> {
    await this.emitEvent("traffic.congestion", {
      road: "Main St",
      level: "heavy",
      avgSpeedMph: 12,
    });
  }
}
