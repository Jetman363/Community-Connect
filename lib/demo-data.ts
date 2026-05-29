/** Fallback demo data when database is unavailable */
export const demoAlerts = [
  {
    id: "demo-1",
    title: "Road Closure — Main St",
    description: "Water main repair until 6 PM. Use Oak Ave detour.",
    severity: "ADVISORY" as "INFO" | "ADVISORY" | "WARNING" | "EMERGENCY",
    lat: 37.7749,
    lng: -122.4194,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Severe Weather Watch",
    description: "High winds expected this evening. Secure outdoor items.",
    severity: "WARNING" as "INFO" | "ADVISORY" | "WARNING" | "EMERGENCY",
    lat: 37.78,
    lng: -122.41,
    active: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const demoPosts = [
  {
    id: "p1",
    content: "Neighborhood cleanup this Saturday at 9 AM — volunteers welcome!",
    category: "NEIGHBORHOOD",
    author: { displayName: "Sarah M.", verified: true },
    likes: 24,
    comments: 8,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "p2",
    content: "Has anyone seen a golden retriever near Cedar Park?",
    category: "GENERAL",
    author: { displayName: "James K.", verified: false },
    likes: 12,
    comments: 15,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

export const demoBusinesses = [
  { id: "b1", name: "Oak Street Bakery", category: "Food", rating: 4.8, verified: true },
  { id: "b2", name: "Green Thumb Landscaping", category: "Services", rating: 4.5, verified: true },
  { id: "b3", name: "Community Auto Care", category: "Automotive", rating: 4.2, verified: false },
];

export const demoEvents = [
  {
    id: "e1",
    title: "Farmers Market",
    location: "Town Square",
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    rsvpCount: 45,
  },
  {
    id: "e2",
    title: "Neighborhood Watch Meeting",
    location: "Community Center",
    startsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    rsvpCount: 18,
  },
];
