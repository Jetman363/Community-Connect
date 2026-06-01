/** Radius onboarding interest categories */
export const RADIUS_INTERESTS = [
  { id: "marketplace", label: "Marketplace" },
  { id: "deals", label: "Local Deals" },
  { id: "restaurants", label: "Restaurants" },
  { id: "events", label: "Events" },
  { id: "family", label: "Family Activities" },
  { id: "sports", label: "Sports" },
  { id: "pets", label: "Pets" },
  { id: "safety", label: "Safety & Alerts" },
  { id: "community", label: "Community" },
  { id: "business", label: "Local Business" },
  { id: "news", label: "Local News" },
  { id: "outdoors", label: "Outdoors" },
] as const;

export type RadiusInterestId = (typeof RADIUS_INTERESTS)[number]["id"];

export const DEFAULT_RADIUS_MILES = 10;
export const RADIUS_PRESETS = [5, 10, 25, 50] as const;

/** Austin TX demo coordinates */
export const DEMO_LOCATION = {
  lat: 30.2672,
  lng: -97.7431,
  city: "Austin",
  state: "TX",
  zip: "78701",
  country: "US",
} as const;
