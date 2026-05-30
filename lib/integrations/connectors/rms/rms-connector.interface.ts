export interface RmsReport {
  externalId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  caseNumber?: string;
  attachments?: RmsAttachmentMeta[];
}

export interface RmsCase {
  externalId: string;
  caseNumber: string;
  title: string;
  status: string;
  reportIds: string[];
}

export interface RmsAttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

export interface RmsConnectorInterface {
  syncReport(payload: Record<string, unknown>): Promise<RmsReport>;
  syncCase(payload: Record<string, unknown>): Promise<RmsCase>;
  getStatus(): Promise<{ connected: boolean; lastSync?: Date }>;
}
