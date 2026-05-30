import { BaseConnector } from "../../base-connector";
import type { ConnectorHealth } from "../../types";
import type { RmsCase, RmsConnectorInterface, RmsReport } from "./rms-connector.interface";

export class MockRmsConnector extends BaseConnector implements RmsConnectorInterface {
  private lastSync = new Date();
  private reports: RmsReport[] = [
    {
      externalId: "MOCK-RMS-R001",
      title: "Theft from vehicle",
      description: "Window smashed, laptop taken",
      category: "crime",
      status: "under_review",
      caseNumber: "2025-0042",
    },
  ];

  get slug(): string {
    return "mock-rms";
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: "HEALTHY",
      lastCheck: new Date(),
      metrics: { reportCount: this.reports.length },
    };
  }

  async syncReport(payload: Record<string, unknown>): Promise<RmsReport> {
    const report: RmsReport = {
      externalId: String(payload.externalId ?? `MOCK-RMS-${Date.now()}`),
      title: String(payload.title ?? "Mock report"),
      description: String(payload.description ?? ""),
      category: String(payload.category ?? "other"),
      status: String(payload.status ?? "submitted"),
    };
    this.reports.push(report);
    this.lastSync = new Date();
    await this.publish({
      type: "report.synced",
      source: "mock-rms",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: report,
    });
    return report;
  }

  async syncCase(payload: Record<string, unknown>): Promise<RmsCase> {
    const rmsCase: RmsCase = {
      externalId: String(payload.externalId ?? `MOCK-CASE-${Date.now()}`),
      caseNumber: String(payload.caseNumber ?? "MOCK-2025-001"),
      title: String(payload.title ?? "Mock case"),
      status: "open",
      reportIds: this.reports.map((r) => r.externalId),
    };
    this.lastSync = new Date();
    await this.publish({
      type: "case.synced",
      source: "mock-rms",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: rmsCase,
    });
    return rmsCase;
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date }> {
    return { connected: true, lastSync: this.lastSync };
  }

  listReports(): RmsReport[] {
    return this.reports;
  }
}
