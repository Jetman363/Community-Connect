import { SmartCityConnector } from "./smart-city-connector";

export class MockWeatherConnector extends SmartCityConnector {
  get slug(): string {
    return "mock-weather";
  }

  get eventTypes(): string[] {
    return ["weather.alert"];
  }

  async ingestEvent(payload: Record<string, unknown>): Promise<void> {
    await this.emitEvent("weather.alert", {
      type: payload.type ?? "advisory",
      headline: payload.headline ?? "Heat advisory",
      expiresAt: payload.expiresAt ?? new Date(Date.now() + 86400_000).toISOString(),
    });
  }

  async emitSample(): Promise<void> {
    await this.emitEvent("weather.alert", {
      type: "wind",
      headline: "High wind advisory",
      expiresAt: new Date(Date.now() + 43200_000).toISOString(),
    });
  }
}
