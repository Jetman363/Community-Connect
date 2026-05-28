export type ReportStatus = "draft" | "pending_review" | "approved" | "finalized" | "locked";
export type PartyRole = "victim" | "complainant" | "witness";

export interface ReportHeader {
  incident_number?: string;
  case_number?: string;
  report_date?: string;
  report_time?: string;
  reporting_officer_id?: string;
  reporting_officer_name?: string;
  assisting_officers?: string[];
  supervisor_id?: string;
  supervisor_name?: string;
  incident_location?: string;
  incident_type?: string;
  call_type?: string;
  priority_level?: string;
  agency?: string;
  division_unit?: string;
}

export interface VictimEntry {
  id?: string;
  role: PartyRole;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  race_ethnicity?: string;
  phone_number?: string;
  email_address?: string;
  home_address?: string;
  driver_license?: string;
  relationship_to_incident?: string;
  injury_information?: string;
  statement_summary?: string;
}

export interface SuspectEntry {
  id?: string;
  is_unknown?: boolean;
  full_name?: string;
  alias?: string;
  dob?: string;
  gender?: string;
  race?: string;
  height?: string;
  weight?: string;
  hair_color?: string;
  eye_color?: string;
  clothing_description?: string;
  identifying_marks?: string;
  address?: string;
  phone_number?: string;
  gang_affiliation?: string;
  warrants_known?: string;
  arrested?: boolean;
  charges?: string;
  miranda_given?: boolean;
  photo_placeholder?: string;
}

export interface VehicleEntry {
  id?: string;
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  style?: string;
  license_plate?: string;
  state?: string;
  vin?: string;
  damage_description?: string;
  registered_owner?: string;
  towed?: boolean;
  tow_company?: string;
  associated_person?: string;
}

export interface WeaponEntry {
  id?: string;
  weapon_type?: string;
  make?: string;
  model?: string;
  caliber?: string;
  serial_number?: string;
  loaded?: boolean;
  recovered?: boolean;
  stolen?: boolean;
  associated_suspect?: string;
  evidence_tag_number?: string;
}

export interface PropertyEntry {
  id?: string;
  property_type?: string;
  description?: string;
  serial_number?: string;
  value?: string;
  owner?: string;
  recovered?: boolean;
  damaged?: boolean;
  evidence_number?: string;
  chain_of_custody_notes?: string;
}

export interface NarcoticEntry {
  id?: string;
  drug_type?: string;
  packaging_type?: string;
  quantity?: string;
  weight_metric?: string;
  weight_metric_unit?: "grams" | "kilograms";
  weight_standard?: string;
  weight_standard_unit?: "ounces" | "pounds";
  estimated_street_value?: string;
  test_performed?: string;
  test_result?: string;
  evidence_number?: string;
  associated_suspect?: string;
}

export interface NarrativeRevision {
  content: string;
  author_id?: string;
  author_name?: string;
  revision_type?: string;
  created_at?: string;
}

export interface SupervisorComment {
  comment: string;
  author_id?: string;
  author_name?: string;
  created_at?: string;
}

export interface IncidentReportFormData {
  header: ReportHeader;
  victims: VictimEntry[];
  suspects: SuspectEntry[];
  vehicles: VehicleEntry[];
  weapons: WeaponEntry[];
  narcotics: NarcoticEntry[];
  property_items: PropertyEntry[];
  narrative: string;
}

export interface IncidentReport extends IncidentReportFormData {
  id: string;
  agency_id: string;
  status: ReportStatus;
  locked: boolean;
  narrative_revisions: NarrativeRevision[];
  supervisor_comments: SupervisorComment[];
  created_by?: string;
  updated_by?: string;
  finalized_at?: string;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  editable: boolean;
  cji_authorized: boolean;
}

export interface IncidentReportSummary {
  id: string;
  incident_number?: string;
  case_number?: string;
  incident_type?: string;
  reporting_officer_name?: string;
  status: ReportStatus;
  report_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportAuditEntry {
  id: number;
  report_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  ip_address?: string;
  details?: Record<string, unknown>;
  suspicious: boolean;
  created_at: string;
}

export const EMPTY_VICTIM = (): VictimEntry => ({ id: crypto.randomUUID(), role: "victim" });
export const EMPTY_SUSPECT = (): SuspectEntry => ({ id: crypto.randomUUID(), is_unknown: false });
export const EMPTY_VEHICLE = (): VehicleEntry => ({ id: crypto.randomUUID() });
export const EMPTY_WEAPON = (): WeaponEntry => ({ id: crypto.randomUUID() });
export const EMPTY_PROPERTY = (): PropertyEntry => ({ id: crypto.randomUUID() });
export const EMPTY_NARCOTIC = (): NarcoticEntry => ({
  id: crypto.randomUUID(),
  weight_metric_unit: "grams",
  weight_standard_unit: "ounces",
});

export function emptyReportForm(officerName?: string): IncidentReportFormData {
  const now = new Date();
  return {
    header: {
      report_date: now.toISOString().slice(0, 10),
      report_time: now.toTimeString().slice(0, 5),
      reporting_officer_name: officerName,
      agency: "San Antonio Police Department",
      priority_level: "Routine",
    },
    victims: [EMPTY_VICTIM()],
    suspects: [EMPTY_SUSPECT()],
    vehicles: [],
    weapons: [],
    narcotics: [],
    property_items: [],
    narrative: "",
  };
}

export const REQUIRED_HEADER_FIELDS: (keyof ReportHeader)[] = [
  "incident_number",
  "report_date",
  "reporting_officer_name",
  "incident_location",
  "incident_type",
];
