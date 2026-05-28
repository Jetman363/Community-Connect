import type { Alert, EntityLink, Incident, Investigation, KpiMetric, Officer, Report, Unit } from "@/types";

export const CURRENT_OFFICER: Officer = {
  id: "off-2847",
  badge: "2847",
  rank: "Detective",
  firstName: "Sarah",
  lastName: "Mitchell",
  email: "s.mitchell@metro-pd.gov",
  agency: "San Antonio Police Dept.",
  agencyId: "00000000-0000-4000-8000-000000000001",
  division: "Major Crimes / Narcotics Task Force",
  shift: "Day Shift (0700–1500)",
  phone: "(555) 412-8891",
  certifications: ["CJIS Certified", "Field Training Officer", "Digital Evidence", "Crisis Intervention"],
  stats: {
    reportsThisMonth: 23,
    casesAssigned: 7,
    avgResponseMin: 4.2,
  },
};

export const KPI_METRICS: KpiMetric[] = [
  { label: "Active Incidents", value: 47, change: 12, trend: "up" },
  { label: "Units Available", value: 18, change: -3, trend: "down" },
  { label: "Avg Response", value: "4.8m", change: -8, trend: "down" },
  { label: "Open Cases", value: 156, change: 2, trend: "up" },
  { label: "Reports Pending Review", value: 12, change: -15, trend: "down" },
  { label: "Clearance Rate (30d)", value: "68%", change: 4, trend: "up" },
];

export const ACTIVE_INCIDENTS: Incident[] = [
  {
    id: "CAD-2026-04821",
    callType: "Armed Robbery – Commercial",
    priority: "critical",
    location: "1247 Commerce Blvd, Unit 3",
    district: "District 4 – Eastside",
    status: "Units En Route",
    assignedUnit: "Adam-12, Baker-7",
    reportedAt: "2026-05-27T14:22:00Z",
    lat: 39.7817,
    lng: -89.6501,
  },
  {
    id: "CAD-2026-04819",
    callType: "Domestic Disturbance",
    priority: "high",
    location: "892 Oakwood Dr",
    district: "District 2 – North",
    status: "On Scene",
    assignedUnit: "Charlie-3",
    reportedAt: "2026-05-27T14:08:00Z",
    lat: 39.8021,
    lng: -89.6442,
  },
  {
    id: "CAD-2026-04815",
    callType: "Traffic Collision – Injury",
    priority: "high",
    location: "I-55 @ Exit 98",
    district: "District 5 – Highway",
    status: "EMS On Scene",
    assignedUnit: "Traffic-1, EMS-4",
    reportedAt: "2026-05-27T13:54:00Z",
    lat: 39.7654,
    lng: -89.6712,
  },
  {
    id: "CAD-2026-04811",
    callType: "Suspicious Person",
    priority: "medium",
    location: "Metro Transit Center, Platform B",
    district: "District 1 – Central",
    status: "Pending Assignment",
    assignedUnit: "—",
    reportedAt: "2026-05-27T13:41:00Z",
    lat: 39.799,
    lng: -89.648,
  },
  {
    id: "CAD-2026-04808",
    callType: "Burglary Alarm – Commercial",
    priority: "medium",
    location: "2200 Industrial Pkwy",
    district: "District 3 – West",
    status: "Cleared – False Alarm",
    assignedUnit: "David-5",
    reportedAt: "2026-05-27T13:28:00Z",
    lat: 39.7888,
    lng: -89.692,
  },
];

export const UNITS: Unit[] = [
  { id: "u1", callSign: "Adam-12", officer: "Off. Rodriguez", status: "en_route", location: "Commerce Blvd", lastUpdate: "2m ago" },
  { id: "u2", callSign: "Baker-7", officer: "Off. Chen", status: "en_route", location: "Commerce Blvd", lastUpdate: "2m ago" },
  { id: "u3", callSign: "Charlie-3", officer: "Off. Williams", status: "on_scene", location: "892 Oakwood Dr", lastUpdate: "1m ago" },
  { id: "u4", callSign: "David-5", officer: "Off. Thompson", status: "available", location: "District 3 HQ", lastUpdate: "5m ago" },
  { id: "u5", callSign: "Echo-9", officer: "Off. Patel", status: "available", location: "Central Precinct", lastUpdate: "3m ago" },
  { id: "u6", callSign: "Traffic-1", officer: "Off. Jackson", status: "on_scene", location: "I-55 Exit 98", lastUpdate: "4m ago" },
  { id: "u7", callSign: "K9-2", officer: "Off. Martinez / K9 Rex", status: "busy", location: "Training Facility", lastUpdate: "12m ago" },
];

export const ALERTS: Alert[] = [
  {
    id: "a1",
    type: "BOLO",
    message: "White Ford F-150, plate ABC-4829 – armed robbery suspect, District 4",
    priority: "critical",
    timestamp: "2026-05-27T14:25:00Z",
  },
  {
    id: "a2",
    type: "Officer Safety",
    message: "CAD-04819 – backup requested, Oakwood Dr",
    priority: "high",
    timestamp: "2026-05-27T14:12:00Z",
  },
  {
    id: "a3",
    type: "Intel",
    message: "Fusion Center: gang activity uptick – Sector 7, next 72hrs",
    priority: "medium",
    timestamp: "2026-05-27T13:00:00Z",
  },
];

export const REPORTS: Report[] = [
  {
    id: "RPT-2026-112847",
    incidentType: "Traffic Stop – Narcotics",
    narrative:
      "On 05/27/2026 at approximately 0915 hours, I initiated a traffic stop on a 2019 Honda Accord for expired registration. Upon contact, I detected odor of marijuana. Consent search yielded 14.2g suspected methamphetamine and $2,340 U.S. currency. Subject arrested for PCS Schedule II and transported to Central Booking.",
    officer: "Det. Sarah Mitchell",
    badge: "2847",
    agencyId: "00000000-0000-4000-8000-000000000001",
    status: "pending_review",
    createdAt: "2026-05-27T09:45:00Z",
    location: "1200 Block N Main St",
    caseNumber: "MC-2026-0892",
  },
  {
    id: "RPT-2026-112801",
    incidentType: "Burglary – Residential",
    narrative:
      "Victim reported forced entry through rear sliding door. Missing items include laptop, jewelry, and $800 cash. Latent prints collected from door frame. Neighbor camera footage requested. Case forwarded to Burglary Unit.",
    officer: "Off. Rodriguez",
    badge: "1923",
    agencyId: "00000000-0000-4000-8000-000000000001",
    status: "approved",
    createdAt: "2026-05-26T16:30:00Z",
    location: "445 Elm Street",
    caseNumber: "BU-2026-0441",
  },
  {
    id: "RPT-2026-112756",
    incidentType: "Assault – Aggravated",
    narrative:
      "Responded to report of stabbing at downtown bar. Victim transported with non-life-threatening injuries. Witness statements collected. Suspect fled on foot; BOLO issued. Evidence: blood sample, broken bottle, surveillance footage from adjacent business.",
    officer: "Off. Chen",
    badge: "2104",
    agencyId: "00000000-0000-4000-8000-000000000001",
    status: "submitted",
    createdAt: "2026-05-26T11:15:00Z",
    location: "88 Market Square",
    caseNumber: "AS-2026-0312",
  },
  {
    id: "RPT-2026-112698",
    incidentType: "Missing Person – Juvenile",
    narrative:
      "16-year-old female last seen 05/25 at 2200 hours near Lincoln Park. Wearing blue hoodie, black leggings. No history of runaway. AMBER Alert criteria not met. Social media monitoring initiated. Family interview completed.",
    officer: "Det. Williams",
    badge: "2655",
    agencyId: "00000000-0000-4000-8000-000000000001",
    status: "draft",
    createdAt: "2026-05-25T14:00:00Z",
    location: "Lincoln Park Area",
    caseNumber: "MP-2026-0087",
  },
  {
    id: "RPT-2026-112612",
    incidentType: "DUI – Arrest",
    narrative:
      "Vehicle observed weaving on I-55. Stop conducted. FST administered – subject failed all tests. BAC 0.14 via preliminary breath test. Vehicle impounded. Subject booked for DUI and released on bond.",
    officer: "Off. Jackson",
    badge: "1789",
    agencyId: "00000000-0000-4000-8000-000000000001",
    status: "approved",
    createdAt: "2026-05-24T23:45:00Z",
    location: "I-55 Mile Marker 102",
    caseNumber: "TR-2026-1204",
  },
];

export const INVESTIGATIONS: Investigation[] = [
  {
    id: "INV-2026-0041",
    title: "Operation Nightfall – Narcotics Distribution Network",
    leadDetective: "Det. Sarah Mitchell",
    status: "active",
    priority: "critical",
    subjects: 12,
    linkedCases: 8,
    lastUpdated: "2026-05-27T12:00:00Z",
    summary: "Multi-agency task force targeting fentanyl distribution ring operating across Districts 2, 4, and 7. 3 search warrants pending.",
  },
  {
    id: "INV-2026-0038",
    title: "Commercial Burglary Series – Eastside",
    leadDetective: "Det. Rodriguez",
    status: "active",
    priority: "high",
    subjects: 4,
    linkedCases: 6,
    lastUpdated: "2026-05-26T18:30:00Z",
    summary: "Pattern analysis links 6 commercial B&E incidents. MO consistent – rear entry, tools left at scene. Latent print match pending AFIS.",
  },
  {
    id: "INV-2026-0035",
    title: "Gang-Related Assault – Market Square",
    leadDetective: "Det. Chen",
    status: "pending",
    priority: "high",
    subjects: 6,
    linkedCases: 3,
    lastUpdated: "2026-05-26T09:00:00Z",
    summary: "Witness cooperation limited. Link analysis suggests connection to prior incidents in Sector 3. Social media intel being processed.",
  },
  {
    id: "INV-2026-0029",
    title: "Identity Theft Ring – Financial Fraud",
    leadDetective: "Det. Williams",
    status: "active",
    priority: "medium",
    subjects: 8,
    linkedCases: 15,
    lastUpdated: "2026-05-25T16:00:00Z",
    summary: "Cross-jurisdictional fraud scheme. 47 victim accounts identified. Federal task force coordination in progress.",
  },
];

export const ENTITY_LINKS: EntityLink[] = [
  { id: "l1", source: "Marcus J. Webb", target: "892 Oakwood Dr", relation: "residence", confidence: 0.94 },
  { id: "l2", source: "Marcus J. Webb", target: "White Ford F-150", relation: "registered_owner", confidence: 0.98 },
  { id: "l3", source: "Marcus J. Webb", target: "INV-2026-0041", relation: "subject_of", confidence: 0.87 },
  { id: "l4", source: "White Ford F-150", target: "CAD-2026-04821", relation: "vehicle_of_interest", confidence: 0.91 },
  { id: "l5", source: "892 Oakwood Dr", target: "CAD-2026-04819", relation: "incident_location", confidence: 1.0 },
  { id: "l6", source: "Marcus J. Webb", target: "RPT-2026-112847", relation: "arrestee", confidence: 0.99 },
];

export const CRIME_TRENDS = [
  { month: "Jan", violent: 42, property: 89, narcotics: 34 },
  { month: "Feb", violent: 38, property: 92, narcotics: 41 },
  { month: "Mar", violent: 45, property: 78, narcotics: 38 },
  { month: "Apr", violent: 51, property: 85, narcotics: 52 },
  { month: "May", violent: 47, property: 81, narcotics: 48 },
];

export const ADMIN_SETTINGS = {
  agency: {
    name: "San Antonio Police Dept.",
    ori: "IL0170100",
    cjisId: "MPD-CJIS-2024-001",
    timezone: "America/Chicago",
  },
  security: {
    mfaRequired: true,
    sessionTimeoutMin: 30,
    passwordPolicy: "CJIS Level 3",
    auditRetentionDays: 2555,
  },
  ai: {
    reportAssistantEnabled: true,
    humanReviewRequired: true,
    llmProvider: "Anthropic Claude",
    maxTokensPerRequest: 4096,
  },
  integrations: {
    cad: "Motorola PremierOne",
    rms: "BlueCore RMS",
    ncic: "Connected",
    fusionCenter: "State Regional Fusion Center",
  },
};
