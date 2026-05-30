import type {
  AlertCategory,
  AlertSeverity,
  IncidentCategory,
  ReportSeverity,
  ReportStatus,
  GeofenceType,
} from "@prisma/client";

export interface SafetyAlertDto {
  id: string;
  communityId: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  lat: number | null;
  lng: number | null;
  radiusM: number | null;
  locationLabel: string | null;
  active: boolean;
  source: string | null;
  createdAt: string;
  expiresAt: string | null;
  acknowledged: boolean;
  bookmarked: boolean;
  ackCount?: number;
}

export interface IncidentReportDto {
  id: string;
  communityId: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: ReportSeverity;
  suggestedCategory: IncidentCategory | null;
  status: ReportStatus;
  anonymous: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
  reporter?: { id: string; displayName: string } | null;
  assignedTo?: { id: string; displayName: string } | null;
}

export interface MapMarkerDto {
  id: string;
  type: "alert" | "report" | "event" | "business";
  title: string;
  lat: number;
  lng: number;
  severity?: AlertSeverity | ReportSeverity;
  category?: string;
  meta?: Record<string, unknown>;
}

export interface GeofenceDto {
  id: string;
  communityId: string;
  name: string;
  type: GeofenceType;
  centerLat: number | null;
  centerLng: number | null;
  radiusM: number | null;
  polygon: unknown;
  active: boolean;
}

export interface WatchAreaDto {
  id: string;
  name: string;
  type: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
}
