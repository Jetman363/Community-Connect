export type ServiceCategory =
  | "food"
  | "home"
  | "automotive"
  | "health"
  | "professional"
  | "retail";

export interface MockBusiness {
  id: string;
  name: string;
  category: ServiceCategory;
  categoryLabel: string;
  rating: number;
  reviewCount: number;
  distance: string;
  address: string;
  phone: string;
  hours: string;
  available: boolean;
  verified: boolean;
  description: string;
  imageUrl?: string;
  tags: string[];
}

export const mockBusinesses: MockBusiness[] = [
  {
    id: "b1",
    name: "Oak Street Bakery",
    category: "food",
    categoryLabel: "Food & Dining",
    rating: 4.8,
    reviewCount: 234,
    distance: "0.3 mi",
    address: "12 Oak St, Oak Hills",
    phone: "(555) 234-5678",
    hours: "Open until 6 PM",
    available: true,
    verified: true,
    description: "Artisan breads, pastries, and locally roasted coffee.",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
    tags: ["Bakery", "Coffee", "Local"],
  },
  {
    id: "b2",
    name: "Green Thumb Landscaping",
    category: "home",
    categoryLabel: "Home Services",
    rating: 4.5,
    reviewCount: 89,
    distance: "1.2 mi",
    address: "45 Garden Ln, Oak Hills",
    phone: "(555) 345-6789",
    hours: "Open · Closes 5 PM",
    available: true,
    verified: true,
    description: "Full-service landscaping, irrigation, and tree care.",
    tags: ["Landscaping", "Licensed", "Insured"],
  },
  {
    id: "b3",
    name: "Community Auto Care",
    category: "automotive",
    categoryLabel: "Automotive",
    rating: 4.2,
    reviewCount: 156,
    distance: "0.8 mi",
    address: "88 Motor Ave, Oak Hills",
    phone: "(555) 456-7890",
    hours: "Open until 7 PM",
    available: true,
    verified: false,
    description: "Oil changes, brakes, and general auto repair.",
    tags: ["Auto Repair", "Same-Day"],
  },
  {
    id: "b4",
    name: "Wellness Family Clinic",
    category: "health",
    categoryLabel: "Health",
    rating: 4.9,
    reviewCount: 312,
    distance: "1.5 mi",
    address: "200 Health Blvd, Oak Hills",
    phone: "(555) 567-8901",
    hours: "Open · Walk-ins welcome",
    available: true,
    verified: true,
    description: "Primary care, urgent visits, and telehealth options.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80",
    tags: ["Healthcare", "Telehealth"],
  },
  {
    id: "b5",
    name: "Harbor Legal Group",
    category: "professional",
    categoryLabel: "Professional",
    rating: 4.7,
    reviewCount: 45,
    distance: "2.1 mi",
    address: "500 Commerce Dr, Oak Hills",
    phone: "(555) 678-9012",
    hours: "By appointment",
    available: false,
    verified: true,
    description: "Estate planning, HOA disputes, and small business law.",
    tags: ["Legal", "HOA"],
  },
  {
    id: "b6",
    name: "Corner Market & Deli",
    category: "retail",
    categoryLabel: "Retail",
    rating: 4.4,
    reviewCount: 178,
    distance: "0.5 mi",
    address: "3 Corner Pl, Oak Hills",
    phone: "(555) 789-0123",
    hours: "Open 24 hours",
    available: true,
    verified: true,
    description: "Groceries, deli sandwiches, and household essentials.",
    tags: ["Grocery", "24/7"],
  },
];

export const serviceCategories: { id: ServiceCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "food", label: "Food" },
  { id: "home", label: "Home" },
  { id: "automotive", label: "Auto" },
  { id: "health", label: "Health" },
  { id: "professional", label: "Professional" },
  { id: "retail", label: "Retail" },
];
