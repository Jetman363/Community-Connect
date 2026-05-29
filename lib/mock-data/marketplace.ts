export type ListingType = "sell" | "buy" | "trade" | "job" | "free";

export interface MockListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: ListingType;
  category: string;
  condition?: string;
  sellerId: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
  views: number;
  saved: boolean;
}

export const mockListings: MockListing[] = [
  {
    id: "m1",
    title: "Patio Furniture Set",
    description: "Barely used 4-piece patio set. Table + 4 chairs. Pick up only.",
    price: 200,
    type: "sell",
    category: "Home & Garden",
    condition: "Like New",
    sellerId: "demo-resident",
    location: "Oak Hills",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    views: 42,
    saved: false,
  },
  {
    id: "m2",
    title: "Looking for: Kids Bike (16\")",
    description: "Need a 16-inch bike for my 6-year-old. Any color works.",
    price: 50,
    type: "buy",
    category: "Sports",
    sellerId: "u2",
    location: "Cedar Park",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    views: 18,
    saved: true,
  },
  {
    id: "m3",
    title: "Trade: Guitar for Keyboard",
    description: "Acoustic guitar in great condition. Looking to trade for a keyboard.",
    price: null,
    type: "trade",
    category: "Music",
    condition: "Good",
    sellerId: "u3",
    location: "Oak Hills",
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    views: 31,
    saved: false,
  },
  {
    id: "m4",
    title: "Part-Time Dog Walker Needed",
    description: "Mon/Wed/Fri mornings. $20/hr. Must love dogs!",
    price: 20,
    type: "job",
    category: "Jobs",
    sellerId: "u2",
    location: "Oak Hills",
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    views: 67,
    saved: false,
  },
  {
    id: "m5",
    title: "Free: Moving Boxes",
    description: "About 20 medium/large boxes. Must pick up by Sunday.",
    price: 0,
    type: "free",
    category: "Free",
    sellerId: "demo-resident",
    location: "Oak Hills",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    views: 89,
    saved: false,
  },
  {
    id: "m6",
    title: "iPhone 14 Pro — Unlocked",
    description: "128GB, excellent condition, includes case and charger.",
    price: 650,
    type: "sell",
    category: "Electronics",
    condition: "Excellent",
    sellerId: "u3",
    location: "Cedar Park",
    imageUrl: "https://images.unsplash.com/photo-1678652197831-023733e126f9?w=600&q=80",
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    views: 156,
    saved: true,
  },
];

export const listingTypes: { id: ListingType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sell", label: "For Sale" },
  { id: "buy", label: "Wanted" },
  { id: "trade", label: "Trade" },
  { id: "job", label: "Jobs" },
  { id: "free", label: "Free" },
];
