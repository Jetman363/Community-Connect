export type UserRole = "officer" | "dispatcher" | "calltaker" | "supervisor" | "admin" | "system_administrator";

export interface User {
  id: string;
  name: string;
  badge: string;
  role: UserRole;
  unitCallSign?: string;
  serviceArea?: string;
  agencyId: string;
  /** Granted when supervisor account is created — enables field-supervisor MDT capabilities */
  supervisorMode?: boolean;
}

export type UnitStatus =
  | "available"
  | "en_route"
  | "on_scene"
  | "transporting"
  | "clear"
  | "out_of_service"
  | "emergency";

/** Officer MDT status button actions (10-8 clears call + requires report). */
export type OfficerStatusAction =
  | "en_route"
  | "on_scene"
  | "transporting"
  | "clear"
  | "out_of_service"
  | "ten_eight";

export interface Unit {
  id: string;
  call_sign: string;
  unit_type: string;
  status: UnitStatus;
  officer_names?: string[];
  latitude?: number;
  longitude?: number;
  heading?: number;
  speed_mph?: number;
}

export interface Incident {
  id: string;
  incident_number: string;
  /** RMS case number — distinct from CAD incident number; triggers mandatory report */
  case_number?: string;
  report_required?: boolean;
  priority: string;
  nature: string;
  incident_type: string;
  status: string;
  caller_name?: string;
  caller_phone?: string;
  location?: string;
  cross_streets?: string;
  apartment?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  narrative?: string;
  hazardous?: boolean;
  weapons_involved?: boolean;
  injuries?: boolean;
  created_at: string;
  assignments?: { call_sign?: string; unit_id: string }[];
  remarks?: { officer_name?: string; remark: string; created_at: string }[];
}

export interface EmergencyCall {
  id: string;
  status: string;
  caller_name?: string;
  caller_phone?: string;
  ani?: string;
  ali_location?: string;
  transcript?: string;
  parsed_data?: Record<string, unknown>;
  started_at: string;
}

export interface BoloAlert {
  id: string;
  title: string;
  description: string;
  subject_type: string;
  plate?: string;
  priority: string;
}

export interface ParseResult {
  incident_type: string;
  priority: string;
  dispatch_code?: string;
  suggested_unit_types: string[];
  narrative_summary: string;
  entities: { type: string; value: string; confidence: number }[];
  threat_indicators: string[];
  confidence: number;
  cad_fields: Record<string, unknown>;
}

export interface CadEvent {
  type: string;
  agency_id: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface TimelineEntry {
  id: string;
  event_type: string;
  description: string;
  incident_id?: string;
  actor_id: string;
  actor_role: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface DemoMessage {
  id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  priority: string;
  incident_id?: string;
  recipient_role?: string;
  read: boolean;
  timestamp: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  priority: string;
}

export interface IncomingCall {
  scenario_id?: string;
  dialogue: string[];
  fields: Record<string, unknown>;
  priority: string;
}

export interface NcicHit {
  type: string;
  source: string;
  title?: string;
  description?: string;
  priority?: string;
  plate?: string;
  subject_name?: string;
  warrant_type?: string;
  case_number?: string;
  location_hint?: string;
  sid?: string;
  vin?: string;
  match_reason?: string;
}

export interface NcicQueryResult {
  query_id: string;
  query_type: "vehicle" | "person";
  status: "hit" | "clear" | "error";
  message: string;
  queried_at: string;
  plate?: string | null;
  state?: string;
  vin?: string | null;
  name?: string | null;
  dob?: string | null;
  dl_number?: string | null;
  sid?: string | null;
  address?: string | null;
  hits: NcicHit[];
}

export interface PendingReport {
  id: string;
  incident_id: string;
  incident_number: string;
  case_number?: string | null;
  nature: string;
  location?: string | null;
  officer_id: string;
  call_sign: string;
  officer_name?: string | null;
  status: "draft" | "submitted";
  narrative: string;
  created_at: string;
  submitted_at?: string;
}

export type ReportLayoutFieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "time"
  | "tel"
  | "email"
  | "checkbox"
  | "yes_no";

export interface ReportLayoutField {
  id: string;
  label: string;
  type: ReportLayoutFieldType;
  required?: boolean;
  options?: string[];
  span?: 1 | 2;
  placeholder?: string;
  default?: string;
}

export interface ReportLayoutSection {
  id: string;
  title: string;
  subtitle?: string;
  repeatable?: boolean;
  entry_label?: string;
  add_label?: string;
  min_entries?: number;
  default_open?: boolean;
  fields: ReportLayoutField[];
  entries: Record<string, string>[];
}

/** Structured report form pulled from Operations Platform / RMS. */
export interface ExternalReportLayout {
  report_id: string;
  incident_id?: string | null;
  incident_number?: string;
  case_number?: string | null;
  rms_link?: {
    incident_id?: string;
    incident_number?: string;
    case_number?: string;
    linked?: boolean;
  } | null;
  source_system: string;
  template_name: string;
  template_version: string;
  prefilled_from: string[];
  sections: ReportLayoutSection[];
}

export interface RmsCaseRecord {
  id?: string;
  incident_id: string;
  incident_number: string;
  case_number?: string | null;
  linked?: boolean;
  nature?: string;
  officer?: string;
  status?: string;
  narrative?: string;
  created_at?: string;
  submitted_at?: string;
}
