import { communityPhotos } from "@/lib/images/community-photos";

export type EventCategory = "community" | "safety" | "market" | "sports" | "arts" | "family";

export interface MockEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  rsvpCount: number;
  capacity: number;
  ticketPrice?: number;
  organizer: string;
  imageUrl?: string;
  rsvpStatus: "going" | "interested" | "none";
}

export const mockEvents: MockEvent[] = [
  {
    id: "e1",
    title: "Farmers Market",
    description: "Fresh produce, artisan goods, and live music every Saturday.",
    location: "Town Square",
    address: "100 Main St, Oak Hills",
    lat: 37.7749,
    lng: -122.4194,
    category: "market",
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 2 + 14400000).toISOString(),
    rsvpCount: 124,
    capacity: 500,
    organizer: "Oak Hills Chamber",
    imageUrl: communityPhotos.events.farmersMarket,
    rsvpStatus: "going",
  },
  {
    id: "e2",
    title: "Neighborhood Watch Meeting",
    description: "Monthly safety briefing with local PD liaison officer.",
    location: "Community Center",
    address: "250 Oak Ave, Oak Hills",
    lat: 37.773,
    lng: -122.42,
    category: "safety",
    startsAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 5 + 7200000).toISOString(),
    rsvpCount: 38,
    capacity: 80,
    organizer: "Neighborhood Watch",
    imageUrl: communityPhotos.events.neighborhoodWatch,
    rsvpStatus: "interested",
  },
  {
    id: "e3",
    title: "Summer Block Party",
    description: "Food trucks, kids zone, and live DJ. Free entry for residents.",
    location: "Cedar Park",
    address: "Cedar Park Dr, Oak Hills",
    lat: 37.776,
    lng: -122.415,
    category: "community",
    startsAt: new Date(Date.now() + 86400000 * 14).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 14 + 18000000).toISOString(),
    rsvpCount: 256,
    capacity: 400,
    ticketPrice: 0,
    organizer: "Oak Hills HOA",
    imageUrl: communityPhotos.events.blockParty,
    rsvpStatus: "none",
  },
  {
    id: "e4",
    title: "Youth Soccer Tournament",
    description: "U12 bracket tournament. Spectators welcome.",
    location: "Riverside Fields",
    address: "400 River Rd, Oak Hills",
    lat: 37.77,
    lng: -122.425,
    category: "sports",
    startsAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 7 + 28800000).toISOString(),
    rsvpCount: 89,
    capacity: 200,
    ticketPrice: 5,
    organizer: "Oak Hills Youth League",
    imageUrl: communityPhotos.events.youthSoccer,
    rsvpStatus: "none",
  },
  {
    id: "e5",
    title: "Art Walk & Gallery Night",
    description: "Local artists showcase work along Main Street galleries.",
    location: "Arts District",
    address: "Main St, Oak Hills",
    lat: 37.775,
    lng: -122.418,
    category: "arts",
    startsAt: new Date(Date.now() + 86400000 * 10).toISOString(),
    endsAt: new Date(Date.now() + 86400000 * 10 + 14400000).toISOString(),
    rsvpCount: 67,
    capacity: 150,
    organizer: "Oak Hills Arts Council",
    imageUrl: communityPhotos.events.artWalk,
    rsvpStatus: "interested",
  },
];

export const eventCategories: { id: EventCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "community", label: "Community" },
  { id: "safety", label: "Safety" },
  { id: "market", label: "Markets" },
  { id: "sports", label: "Sports" },
  { id: "arts", label: "Arts" },
  { id: "family", label: "Family" },
];
