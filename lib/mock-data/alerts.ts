export type AlertSeverity = "INFO" | "ADVISORY" | "WARNING" | "EMERGENCY";
export type AlertCategory =
  | "crime"
  | "weather"
  | "traffic"
  | "missing"
  | "hoa"
  | "community";

export interface MockAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  location: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt: string;
  source: string;
}

export const mockAlerts: MockAlert[] = [
  {
    id: "a1",
    title: "Armed Robbery — Avoid Main St",
    description: "Police responding to incident near 4th & Main. Avoid area until cleared.",
    severity: "EMERGENCY",
    category: "crime",
    location: "4th & Main St",
    lat: 37.7749,
    lng: -122.4194,
    active: true,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    source: "Oak Hills PD",
  },
  {
    id: "a2",
    title: "Severe Wind Advisory",
    description: "Gusts up to 45 mph expected 6–10 PM. Secure outdoor furniture.",
    severity: "WARNING",
    category: "weather",
    location: "Oak Hills County",
    lat: 37.78,
    lng: -122.41,
    active: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    source: "National Weather Service",
  },
  {
    id: "a3",
    title: "Road Closure — Water Main Repair",
    description: "Oak Ave closed between Cedar & Pine until 6 PM. Use Maple detour.",
    severity: "ADVISORY",
    category: "traffic",
    location: "Oak Ave",
    lat: 37.772,
    lng: -122.422,
    active: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    source: "Public Works",
  },
  {
    id: "a4",
    title: "Missing Person — Elderly Male",
    description: "Robert H., 78, last seen near Cedar Park. Gray jacket, walking cane.",
    severity: "WARNING",
    category: "missing",
    location: "Cedar Park",
    lat: 37.776,
    lng: -122.415,
    active: true,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    source: "Sheriff's Office",
  },
  {
    id: "a5",
    title: "HOA Pool Maintenance",
    description: "Community pool closed May 30–31 for annual maintenance.",
    severity: "INFO",
    category: "hoa",
    location: "Oak Hills HOA",
    lat: 37.775,
    lng: -122.418,
    active: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    source: "Oak Hills HOA",
  },
  {
    id: "a6",
    title: "Neighborhood Watch Meeting Tonight",
    description: "Join us at 7 PM at the community center for safety updates.",
    severity: "INFO",
    category: "community",
    location: "Community Center",
    lat: 37.773,
    lng: -122.42,
    active: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    source: "Neighborhood Watch",
  },
];

export const alertCategories: { id: AlertCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "crime", label: "Crime" },
  { id: "weather", label: "Weather" },
  { id: "traffic", label: "Traffic" },
  { id: "missing", label: "Missing Persons" },
  { id: "hoa", label: "HOA" },
  { id: "community", label: "Community" },
];
