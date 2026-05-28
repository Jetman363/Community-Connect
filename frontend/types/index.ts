export type Priority = "critical" | "high" | "medium" | "low";
export type ReportStatus = "draft" | "pending_review" | "approved" | "submitted";
export type UnitStatus = "available" | "en_route" | "on_scene" | "busy" | "off_duty";

export interface Officer {
  id: string;
  badge: string;
  rank: string;
  firstName: string;
  lastName: string;
  email: string;
  agency: string;
  agencyId: string;
  division: string;
  shift: string;
  phone: string;
  certifications: string[];
  stats: {
    reportsThisMonth: number;
    casesAssigned: number;
    avgResponseMin: number;
  };
}

export interface Incident {
  id: string;
  callType: string;
  priority: Priority;
  location: string;
  district: string;
  status: string;
  assignedUnit: string;
  reportedAt: string;
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  incidentType: string;
  narrative: string;
  officer: string;
  badge: string;
  agencyId: string;
  status: ReportStatus;
  createdAt: string;
  location: string;
  caseNumber: string;
}

export interface Investigation {
  id: string;
  title: string;
  leadDetective: string;
  status: "active" | "pending" | "closed";
  priority: Priority;
  subjects: number;
  linkedCases: number;
  lastUpdated: string;
  summary: string;
}

export interface EntityLink {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: number;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  priority: Priority;
  timestamp: string;
}

export interface KpiMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface Unit {
  id: string;
  callSign: string;
  officer: string;
  status: UnitStatus;
  location: string;
  lastUpdate: string;
}
