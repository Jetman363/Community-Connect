import { communityPhotos } from "@/lib/images/community-photos";

export type ListingType = "sell" | "buy" | "trade" | "job" | "free";

export type ClassifiedType =
  | "garage_sale"
  | "estate_sale"
  | "moving_sale"
  | "lost_found"
  | "giveaway"
  | "wanted";

export interface MockSeller {
  id: string;
  displayName: string;
  verified: boolean;
  reputationScore: number;
  totalSales: number;
  memberSince: string;
}

export interface MockListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: ListingType;
  category: string;
  condition?: string;
  classifiedType?: ClassifiedType;
  sellerId: string;
  location: string;
  imageUrl?: string;
  imageGallery?: string[];
  createdAt: string;
  views: number;
  saved: boolean;
  trending?: boolean;
  nearby?: boolean;
}

export const mockSellers: Record<string, MockSeller> = {
  "demo-resident": {
    id: "demo-resident",
    displayName: "Alex Resident",
    verified: true,
    reputationScore: 4.9,
    totalSales: 23,
    memberSince: "2023-03-15",
  },
  u2: {
    id: "u2",
    displayName: "Sarah Martinez",
    verified: true,
    reputationScore: 4.7,
    totalSales: 15,
    memberSince: "2022-08-01",
  },
  u3: {
    id: "u3",
    displayName: "James Kim",
    verified: false,
    reputationScore: 4.2,
    totalSales: 8,
    memberSince: "2024-01-10",
  },
  u4: {
    id: "u4",
    displayName: "Maria Lopez",
    verified: true,
    reputationScore: 5.0,
    totalSales: 41,
    memberSince: "2021-06-20",
  },
};

export const marketplaceQuickCategories = [
  { id: "all", label: "All" },
  { id: "Vehicles", label: "Vehicles" },
  { id: "Electronics", label: "Electronics" },
  { id: "Furniture", label: "Furniture" },
  { id: "Home & Garden", label: "Home & Garden" },
  { id: "Sports", label: "Sports" },
  { id: "Clothing", label: "Clothing" },
  { id: "Tools", label: "Tools" },
  { id: "Free", label: "Free" },
] as const;

export const classifiedFilters = [
  { id: "all", label: "All Classifieds" },
  { id: "garage_sale", label: "Garage Sales" },
  { id: "estate_sale", label: "Estate Sales" },
  { id: "moving_sale", label: "Moving Sales" },
  { id: "lost_found", label: "Lost & Found" },
  { id: "giveaway", label: "Giveaways" },
  { id: "wanted", label: "Wanted" },
] as const;

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
    imageUrl: communityPhotos.marketplace.patio,
    imageGallery: [
      communityPhotos.marketplace.patio,
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    views: 42,
    saved: false,
    trending: true,
    nearby: true,
  },
  {
    id: "m2",
    title: "Looking for: Kids Bike (16\")",
    description: "Need a 16-inch bike for my 6-year-old. Any color works.",
    price: 50,
    type: "buy",
    category: "Sports",
    classifiedType: "wanted",
    sellerId: "u2",
    location: "Cedar Park",
    imageUrl: communityPhotos.marketplace.bike,
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
    imageUrl: communityPhotos.marketplace.guitar,
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
    classifiedType: "giveaway",
    sellerId: "demo-resident",
    location: "Oak Hills",
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    views: 89,
    saved: false,
    nearby: true,
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
    imageGallery: [
      "https://images.unsplash.com/photo-1678652197831-023733e126f9?w=600&q=80",
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    ],
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    views: 156,
    saved: true,
    trending: true,
  },
  {
    id: "m7",
    title: "Community Garage Sale — Oak Hills Block",
    description: "Multi-family garage sale Sat 8am–2pm. Furniture, tools, kids toys, and more!",
    price: null,
    type: "sell",
    category: "Home & Garden",
    classifiedType: "garage_sale",
    sellerId: "u4",
    location: "Oak Hills · 1200 Block",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    views: 234,
    saved: false,
    trending: true,
    nearby: true,
  },
  {
    id: "m8",
    title: "LOST: Orange Tabby Cat — Mango",
    description: "Last seen near Cedar Park playground. Very friendly, chipped. Reward offered.",
    price: null,
    type: "buy",
    category: "Pets",
    classifiedType: "lost_found",
    sellerId: "u3",
    location: "Cedar Park",
    imageUrl: communityPhotos.feed.lostPet,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    views: 412,
    saved: true,
    trending: true,
  },
  {
    id: "m9",
    title: "Estate Sale — Antiques & Collectibles",
    description: "Fri–Sun 9am–4pm. Mid-century furniture, vintage records, art.",
    price: null,
    type: "sell",
    category: "Furniture",
    classifiedType: "estate_sale",
    sellerId: "u4",
    location: "Willow Creek",
    imageUrl: "https://images.unsplash.com/photo-1616046229476-99f781a2826d?w=600&q=80",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    views: 178,
    saved: false,
  },
  {
    id: "m10",
    title: "DeWalt Power Tool Set",
    description: "Drill, impact driver, circular saw. Lightly used, all batteries included.",
    price: 275,
    type: "sell",
    category: "Tools",
    condition: "Good",
    sellerId: "demo-resident",
    location: "Oak Hills",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d0c59?w=600&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1504148455328-c376907d0c59?w=600&q=80",
      "https://images.unsplash.com/photo-1586864387776-6282a057ae98?w=600&q=80",
    ],
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    views: 95,
    saved: false,
    nearby: true,
  },
  {
    id: "m11",
    title: "Moving Sale — Everything Must Go!",
    description: "Relocating out of state. Furniture, appliances, kitchenware. Cash only.",
    price: null,
    type: "sell",
    category: "Furniture",
    classifiedType: "moving_sale",
    sellerId: "u2",
    location: "Maple Ridge",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    views: 143,
    saved: false,
  },
  {
    id: "m12",
    title: "Free: Baby Clothes (0–12 mo)",
    description: "Two large bags of gently used baby clothes. Gender neutral.",
    price: 0,
    type: "free",
    category: "Clothing",
    classifiedType: "giveaway",
    sellerId: "u4",
    location: "Oak Hills",
    createdAt: new Date(Date.now() - 57600000).toISOString(),
    views: 67,
    saved: false,
    nearby: true,
  },
  {
    id: "m13",
    title: "2019 Honda Civic — 45k miles",
    description: "Single owner, clean title, regular maintenance. Silver, automatic.",
    price: 18500,
    type: "sell",
    category: "Vehicles",
    condition: "Excellent",
    sellerId: "u4",
    location: "Oak Hills",
    imageUrl: "https://images.unsplash.com/photo-1549317761-9b23e7d4f9d2?w=600&q=80",
    imageGallery: [
      "https://images.unsplash.com/photo-1549317761-9b23e7d4f9d2?w=600&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494451e?w=600&q=80",
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 289,
    saved: true,
    trending: true,
  },
  {
    id: "m14",
    title: "Wanted: Lawn Mower (Push or Self-Propelled)",
    description: "Looking for a working push or self-propelled mower. Budget up to $150.",
    price: 150,
    type: "buy",
    category: "Tools",
    classifiedType: "wanted",
    sellerId: "demo-resident",
    location: "Oak Hills",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    views: 34,
    saved: false,
  },
  {
    id: "m15",
    title: "FOUND: Set of Keys near Library",
    description: "Found a keychain with 4 keys and a library card. Contact to identify.",
    price: null,
    type: "free",
    category: "Other",
    classifiedType: "lost_found",
    sellerId: "u2",
    location: "Town Square Library",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    views: 56,
    saved: false,
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

export const mockMarketplaceRecommendations = [
  {
    id: "mr1",
    title: "DeWalt Power Tool Set",
    reason: "You recently searched for power tools",
    href: "/marketplace",
    listingId: "m10",
  },
  {
    id: "mr2",
    title: "Community Garage Sale — Oak Hills Block",
    reason: "Trending garage sale near you",
    href: "/marketplace",
    listingId: "m7",
  },
  {
    id: "mr3",
    title: "2019 Honda Civic",
    reason: "Popular listing in Vehicles",
    href: "/marketplace",
    listingId: "m13",
  },
];
