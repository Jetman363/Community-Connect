import { BaseConnector } from "../../base-connector";
import type { ConnectorHealth } from "../../types";
import type { RmsCase, RmsConnectorInterface, RmsReport } from "./rms-connector.interface";

export class GenericRmsAdapter extends BaseConnector implements RmsConnectorInterface {
  get slug(): string {
    return "generic-rms";
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      status: this.ctx.config.syncUrl ? "HEALTHY" : "UNKNOWN",
      lastCheck: new Date(),
    };
  }

  async syncReport(payload: Record<string, unknown>): Promise<RmsReport> {
    const report: RmsReport = {
      externalId: String(payload.id ?? payload.reportId ?? crypto.randomUUID()),
      title: String(payload.title ?? "Report"),
      description: String(payload.description ?? ""),
      category: String(payload.category ?? "other"),
      status: String(payload.status ?? "submitted"),
      caseNumber: payload.caseNumber != null ? String(payload.caseNumber) : undefined,
    };
    await this.publish({
      type: "report.synced",
      source: "generic-rms",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: report,
    });
    return report;
  }

  async syncCase(payload: Record<string, unknown>): Promise<RmsCase> {
    const rmsCase: RmsCase = {
      externalId: String(payload.id ?? crypto.randomUUID()),
      caseNumber: String(payload.caseNumber ?? "CASE-UNKNOWN"),
      title: String(payload.title ?? "Case"),
      status: String(payload.status ?? "open"),
      reportIds: Array.isArray(payload.reportIds)
        ? payload.reportIds.map(String)
        : [],
    };
    await this.publish({
      type: "case.synced",
      source: "generic-rms",
      organizationId: this.ctx.organizationId,
      communityId: this.ctx.communityId,
      payload: rmsCase,
    });
    return rmsCase;
  }

  async getStatus(): Promise<{ connected: boolean; lastSync?: Date }> {
    return { connected: Boolean(this.ctx.config.syncUrl) };
  }
}
