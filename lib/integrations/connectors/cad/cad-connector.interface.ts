export interface CadIncident {
  externalId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  status: string;
  units?: CadUnitStatus[];
  timeline?: CadTimelineEntry[];
}

export interface CadUnitStatus {
  unitId: string;
  status: string;
  assignedIncidentId?: string;
  updatedAt: Date;
}

export interface CadTimelineEntry {
  id: string;
  message: string;
  timestamp: Date;
  actor?: string;
}

export interface CadConnectorInterface {
  ingestIncident(payload: Record<string, unknown>): Promise<CadIncident>;
  getUnitStatus(): Promise<CadUnitStatus[]>;
  dispatchNotification(incidentId: string, message: string): Promise<void>;
  getTimeline(incidentId: string): Promise<CadTimelineEntry[]>;
}
